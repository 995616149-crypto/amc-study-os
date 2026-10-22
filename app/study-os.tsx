"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, BookOpen, BrainCircuit, CalendarClock, CheckCircle2, Clock3, Database, Languages, Library, Target, TriangleAlert, XCircle, Map as MapIcon, Radar, ChevronRight, RefreshCw, StickyNote, Search, Trash2, MessageCircle, Send, Minus, ExternalLink, LoaderCircle, X, Pin, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WordCache, WordLookupEngine, createSequenceGuard, wordCacheKey } from "@/lib/word-lookup-core";
import { loadLexicon, peekLocal, warmLexicon } from "@/lib/lexicon/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveSafeVisualOverlay } from "./safe-visual-overlay";
import { AITutor } from "./ai-tutor";
import { QuestionMap } from "./question-map";
import { TextbookBlocks, pageRangeLabel } from "./textbook/blocks";
import { buildGuidelineQueue, buildTargetedQueue, concise, distractorReason, guidanceFromDualAnswer, type Guidance, type QueueItem } from "@/lib/learning-engine";
import { normalizeChapterBlock } from "@/lib/chapter-block-contract";
import { practiceabilityLabel } from "@/lib/practiceability";
import type { AmcCoach } from "@/lib/amc-coach";

type Data = any;
type WordInfo = { lemma:string; translationZh:string; contextualMeaningZh:string; partOfSpeech:string; morphologyZh:string; etymologyZh:string; mnemonicZh:string; entityType:string; source:string };
type ExplanationBlock = { type:"paragraph"|"heading"|"bullet-list"|"ordered-list"|"clinical-pathway"|"table"; text?:string; items?:string[]; rows?:string[][] };
type ExplanationType = "source-era"|"memory-rule"|"ai-coach"|"knowledge-node"|"chapter-review";
type TranslationState = {visible:boolean;blocks?:ExplanationBlock[];loading?:boolean;error?:string;cache?:string;provider?:string};
type WordPanelState = {surface:string;status:"loading"|"ready"|"error";word?:import("@/lib/word-lookup-core").WordEntry;error?:string;retryable?:boolean;layer?:import("@/lib/word-lookup-core").LookupLayer;latencyMs?:number;queryKey:string};
const WORD_LAYER_LABEL:Record<string,string>={memory:"内存缓存",persistent:"本地缓存",lexicon:"本地词典","server-cache":"服务器缓存",api:"在线词典"};
function wordLayerLabel(layer?:string){return layer?WORD_LAYER_LABEL[layer]??layer:"查询中"}
type NoteRow = {id:string;scope_key:string;note_type:"question"|"chapter";question_id?:string|null;chapter_id?:string|null;section_id?:string|null;body:string;created_at:string;updated_at:string};
type SubmitAsyncState = {attempt:"idle"|"saving"|"synced"|"error";guidance:"idle"|"loading"|"ready"|"unverified";coach:"idle"|"loading"|"ready"};
type TutorBlock = {type:"heading"|"paragraph"|"bullet_list"|"numbered_list"|"comparison_table"|"drug_table"|"algorithm"|"clinical_pearl"|"warning"|"exam_trap"|"takeaway";text?:string;title?:string;items?:string[];columns?:string[];rows?:string[][];steps?:Array<{label:string;detail?:string}>};

function safeJson<T>(value:unknown,fallback:T):T{try{return typeof value==="string"?JSON.parse(value):value as T}catch{return fallback}}
function isUsefulMemoryRule(text:unknown){const value=String(text??"").trim();return !!value&&!/retain the source-era answer|verify current australian guidance/i.test(value)}
function optionLabel(options:any[],key:string|null){if(!key)return "";const option=options.find((row:any)=>row.option_key===key);return option?`${key}. ${String(option.text_en).replace(/^O?[A-E][.)]?\s*/i,"").trim()}`:key}
function attemptEvidenceType(correct:boolean,confidence:string){return correct?(confidence==="confident"?"strong-positive":confidence==="guess"?"hidden-weakness":"uncertain-correct"):(confidence==="confident"?"misconception":confidence==="guess"?"knowledge-gap":"clear-gap")}

function daysUntil(date:string){ return Math.ceil((new Date(date+"T00:00:00").getTime()-Date.now())/86400000); }
function cn(...v:(string|false|undefined)[]){return v.filter(Boolean).join(" ");}

/**
 * Latest-request-wins guard for per-question async work.
 *
 * Switching questions while a translation / coach / locator request is in flight used
 * to let the OLD response land after the new question was already on screen, so the
 * previous question's translation appeared under the new one. Two rules fix it and
 * both are needed:
 *
 *   1. question-derived components are keyed by `questionId` at their render site, so
 *      a question change unmounts them and their local state cannot survive;
 *   2. every response is checked against the request that produced it before it is
 *      allowed to touch state — `stillCurrent()` is false for a superseded request and
 *      for a component that has unmounted.
 *
 * Deliberately not solved with timers or a forced reload: a late response is dropped,
 * never displayed and never refreshed around.
 */
function useLatestRequest(){
  const id=useRef(0);
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return ()=>{alive.current=false}},[]);
  return ()=>{const mine=++id.current;return ()=>alive.current&&mine===id.current};
}
// A 401 now means "no owner session in this browser" rather than "the platform did
// not inject identity".  Send the browser to the access gate instead of leaving the
// shell on its skeleton forever.
function redirectToSignIn(response:Response){if(response.status!==401)return false;const returnTo=`${window.location.pathname}${window.location.search}`;window.location.assign(`/login?return_to=${encodeURIComponent(returnTo)}`);return true}
// Lightweight local fallback for the practice cursor.  It is only a cache of the
// server-side position so the shell can resume instantly, never a second
// progress system: attempt history, FSRS and review state are untouched.
// The resume cursor is keyed by practice scope.  The all-sources scope keeps the
// original key so an existing session resumes exactly where it left off, and a
// newly added question source writes its own key and can never move another
// source's cursor.  This is still only a cursor: attempt history, FSRS and review
// state remain the single source of truth for progress.
const DETAIL_CACHE_MAX=60;
const POSITION_STORAGE_KEY="amc-study-os.practice-position.v1";
const POSITION_STORAGE_KEY_V2="amc-study-os.practice-position.v2";
type StoredPosition={questionId:string;practiceScope:string;updatedAt:string};
function readLocalPositions():Record<string,StoredPosition>{const out:Record<string,StoredPosition>={};try{const raw=window.localStorage.getItem(POSITION_STORAGE_KEY_V2);if(raw){const parsed=JSON.parse(raw);if(parsed&&typeof parsed==="object")for(const [key,value] of Object.entries<any>(parsed))if(value&&typeof value.questionId==="string")out[key]=value}}catch{}try{const legacy=window.localStorage.getItem(POSITION_STORAGE_KEY);if(legacy){const parsed=JSON.parse(legacy);if(parsed&&typeof parsed.questionId==="string"&&!out[parsed.practiceScope??"all"])out[parsed.practiceScope??"all"]=parsed}}catch{}return out}
function writeLocalPosition(questionId:string,practiceScope:string){try{const next={...readLocalPositions(),[practiceScope]:{questionId,practiceScope,updatedAt:new Date().toISOString()}};window.localStorage.setItem(POSITION_STORAGE_KEY_V2,JSON.stringify(next))}catch{}}
function clearLocalPosition(practiceScope?:string){try{if(!practiceScope){window.localStorage.removeItem(POSITION_STORAGE_KEY_V2);window.localStorage.removeItem(POSITION_STORAGE_KEY);return}const next=readLocalPositions();for(const key of Object.keys(next))if(key===practiceScope||key.startsWith(`${practiceScope}|`))delete next[key];window.localStorage.setItem(POSITION_STORAGE_KEY_V2,JSON.stringify(next))}catch{}}
// Question sources are a first-class scope.  `all` spans every source.  The
// provider value is a display string, so it is normalised the same way the
// server does before it is compared with a scope key.
const sourceScopeKey=(provider?:string|null)=>provider==="Emidici"?"emidici":provider?String(provider).toLowerCase():"legacy";
// OWNER decision: Emidici is the primary question bank.  The practice pool therefore
// defaults to Emidici, legacy questions remain available as an explicit opt-in, and a
// legacy question that is not practiceable is no longer in the pool at all -- so there
// is deliberately no "Legacy unusable" filter to show.
const SOURCE_SCOPE_OPTIONS=[{key:"emidici",label:"Emidici（默认）"},{key:"legacy",label:"Legacy usable"},{key:"all",label:"All usable"}];
const SOURCE_SCOPE_STORAGE_KEY="amc-study-os.question-source.v1";
const DEFAULT_SOURCE_SCOPE="emidici";
function readStoredSourceScope():string{try{const raw=window.localStorage.getItem(SOURCE_SCOPE_STORAGE_KEY);return raw&&SOURCE_SCOPE_OPTIONS.some((o)=>o.key===raw)?raw:DEFAULT_SOURCE_SCOPE}catch{return DEFAULT_SOURCE_SCOPE}}
function writeStoredSourceScope(scope:string){try{window.localStorage.setItem(SOURCE_SCOPE_STORAGE_KEY,scope)}catch{}}
const EMPTY_POSITIONS:Record<string,StoredPosition>={};
function blocksFromText(text:string):ExplanationBlock[]{const lines=text.replace(/\r/g,"").split("\n");const blocks:ExplanationBlock[]=[];for(let i=0;i<lines.length;){const line=lines[i].trim();if(!line){i++;continue}if(/^#{1,6}\s+/.test(line)){blocks.push({type:"heading",text:line.replace(/^#{1,6}\s+/,"")});i++;continue}if(/^[-*]\s+/.test(line)){const items:string[]=[];while(i<lines.length&&/^[-*]\s+/.test(lines[i].trim()))items.push(lines[i++].trim().replace(/^[-*]\s+/,""));blocks.push({type:"bullet-list",items});continue}if(/^\d+[.)]\s+/.test(line)){const items:string[]=[];while(i<lines.length&&/^\d+[.)]\s+/.test(lines[i].trim()))items.push(lines[i++].trim().replace(/^\d+[.)]\s+/,""));blocks.push({type:"ordered-list",items});continue}if(/^\|.*\|$/.test(line)){const rows:string[][]=[];while(i<lines.length&&/^\|.*\|$/.test(lines[i].trim())){const cells=lines[i++].trim().slice(1,-1).split("|").map(cell=>cell.trim());if(!cells.every(cell=>/^:?-{3,}:?$/.test(cell)))rows.push(cells)}blocks.push({type:"table",rows});continue}const paragraph:string[]=[];while(i<lines.length&&lines[i].trim()&&!/^#{1,6}\s+|^[-*]\s+|^\d+[.)]\s+|^\|.*\|$/.test(lines[i].trim()))paragraph.push(lines[i++].trim());blocks.push({type:"paragraph",text:paragraph.join(" ")})}return blocks}
function BootShell({error,onRetry}:{error:string;onRetry:()=>void}){
  // First paint: the top bar and navigation appear immediately, then the data
  // areas fill in.  The shell never waits for the corpus, the Question Map
  // totals, the Knowledge Graph or any translation.
  const tabs:[string,any][]=[["总览",Target],["刷题",BookOpen],["题目总览",MapIcon],["复习",CalendarClock],["指南更新",RefreshCw],["错题",TriangleAlert],["词汇",Languages],["笔记",StickyNote],["知识库",BrainCircuit],["资料库",Library]];
  return <main className="app-shell"><header className="topbar"><div className="brand"><span className="brand-mark"><Activity size={19}/></span><div><b>AMC Study OS</b><small>Evidence-gated Learning Engine</small></div></div><div className="top-status"><Badge variant="outline">Private</Badge></div></header><div className="workspace"><nav className="nav" aria-label="AMC Study OS navigation">{tabs.map(([label,Icon])=><button key={label} type="button" disabled><Icon/>{label}</button>)}</nav>{error&&<p className="resume-hint stale" role="alert">{error}<button type="button" onClick={onRetry} style={{marginLeft:"auto",border:0,background:"transparent",textDecoration:"underline",cursor:"pointer",color:"inherit"}}>重试</button></p>}<section className="practice-grid"><article className="question-card"><div className="boot-skeleton"><span className="bar w40"/><span className="bar"/><span className="bar w70"/><div className="stack"><span className="option-ghost"/><span className="option-ghost"/><span className="option-ghost"/><span className="option-ghost"/></div><p className="boot-note">正在载入题库与上次练习位置；题目总览、知识图谱与 AI Coach 会在首屏之后加载。</p></div></article><aside className="study-side"><section className="panel boot-skeleton"><span className="bar w40"/><div className="stack"><span className="bar"/><span className="bar w70"/><span className="bar"/></div></section></aside></section></div></main>
}
function Stat({label,value,detail}:{label:string;value:string|number;detail:string}){return <div className="metric"><p>{label}</p><strong>{value}</strong><span>{detail}</span></div>}
function buildInsights(nodes:any[],attempts:any[],links:any[],reviews:any[]){
  const now=Date.now();
  const assessed=nodes.map((node:any)=>{const ids=new Set(links.filter((l:any)=>l.node_id===node.id).map((l:any)=>l.question_id));const a=attempts.filter((x:any)=>ids.has(x.question_id));const unique=new Set(a.map((x:any)=>x.question_id)).size;const correct=a.filter((x:any)=>x.correct);const first=a.filter((x:any,i:number)=>!a.slice(0,i).some((y:any)=>y.question_id===x.question_id));const wrongConf=a.filter((x:any)=>!x.correct&&x.confidence==="confident").length;const guess=a.filter((x:any)=>x.correct&&x.confidence==="guess").length;const uncertain=a.filter((x:any)=>x.correct&&x.confidence==="uncertain").length;const recent=a.slice(0,5);const accuracy=a.length?Math.round(correct.length/a.length*100):null;const firstPass=first.length?Math.round(first.filter((x:any)=>x.correct).length/first.length*100):null;const recentAccuracy=recent.length?Math.round(recent.filter((x:any)=>x.correct).length/recent.length*100):null;const conf=a.filter((x:any)=>x.confidence==="confident");const confidentAccuracy=conf.length?Math.round(conf.filter((x:any)=>x.correct).length/conf.length*100):null;const repeatErrors=Math.max(0,a.filter((x:any)=>!x.correct).length-1);const avg=a.length?Math.round(a.reduce((s:number,x:any)=>s+x.elapsed_ms,0)/a.length/1000):null;const review=reviews.find((r:any)=>r.node_id===node.id);const due=review?new Date(review.due_at).getTime()<=now:false;let status="unassessed";if(a.length){status=unique<2?"insufficient evidence":wrongConf>=2||repeatErrors>=2?"confirmed weakness":wrongConf||guess||(accuracy!==null&&accuracy<65)?"possible weakness":due?"review due":accuracy!==null&&accuracy>=80&&confidentAccuracy!==null&&confidentAccuracy>=75?"stable":"improving"}const mastery=a.length?Math.max(0,Math.min(100,Math.round((accuracy??0)*.45+(confidentAccuracy??accuracy??0)*.25+(recentAccuracy??accuracy??0)*.2-Math.min(25,wrongConf*9+guess*5)+Math.min(10,unique*3)))):null;const priority=a.length?Math.min(100,Math.round((100-(mastery??0))*.45+wrongConf*18+guess*10+repeatErrors*8+(due?16:0))):0;return {...node,attemptCount:a.length,uniqueQuestionCount:unique,firstPassAccuracy:firstPass,recentAccuracy,confidentAccuracy,highConfidenceWrong:wrongConf,correctGuess:guess,uncertainCorrect:uncertain,repeatErrors,averageTime:avg,lastSeen:a[0]?.attempted_at??null,reviewDue:due,mastery,status,priority,evidenceStrength:unique>=3?"repeated evidence":unique>=1?"limited evidence":"no evidence"}});
  return {assessed,unassessed:assessed.filter((n:any)=>n.status==="unassessed"),weak:assessed.filter((n:any)=>["possible weakness","confirmed weakness","review due"].includes(n.status)),due:assessed.filter((n:any)=>n.reviewDue),radar:radarFromAttempts(attempts)};
}
function radarFromAttempts(attempts:any[]){const rows=["initial vs definitive investigation","immediate vs definitive management","screening vs diagnostic","stable vs unstable","common diagnosis vs must-not-miss","first-line vs escalation treatment"].map(label=>({label,count:0}));return rows.map(row=>({...row,count:attempts.filter((a:any)=>!a.correct&&a.confidence==="confident"&&/misconception|clear-gap/.test(a.error_type??"")).length?0:0}));}

export default function StudyOS(){
  const [data,setData]=useState<Data|null>(null),[error,setError]=useState("");
  const [deferredState,setDeferredState]=useState<"idle"|"loading"|"ready"|"error">("idle");
  const [coachStates,setCoachStates]=useState<Record<string,{status:"idle"|"loading"|"ready"|"error";error?:string}>>({});
  const [extendedNote,setExtendedNote]=useState(false);
  const [resumeHint,setResumeHint]=useState<{text:string;stale?:boolean}|null>(null);
  // The chosen question source survives a reload, so the learner comes back to
  // the bank they were working in and its own resume cursor still applies.
  const [sourceScope,setSourceScope]=useState<string>(()=>readStoredSourceScope());
  const positionsRef=useRef<Record<string,StoredPosition>>({});
  const pendingQuestionId=useRef<string|null>(null);
  const positionTimer=useRef<any>(null);
  const detailRequested=useRef(new Set<string>());
  const [tab,setTab]=useState("dashboard"),[questionIndex,setQuestionIndex]=useState(0),[selected,setSelected]=useState(""),[confidence,setConfidence]=useState("uncertain"),[result,setResult]=useState<any>(null),[started,setStarted]=useState(Date.now());
  const [queueItems,setQueueItems]=useState<QueueItem[]>([]),[queuePos,setQueuePos]=useState(0);
  const [wordPanel,setWordPanel]=useState<WordPanelState|null>(null),[wordPinned,setWordPinned]=useState(false),[wordCollapsed,setWordCollapsed]=useState(false),[sourceQuestionId,setSourceQuestionId]=useState<string|null>(null),[savingWord,setSavingWord]=useState(false),[showZh,setShowZh]=useState<Record<string,boolean>>({}),[translations,setTranslations]=useState<Record<string,TranslationState>>({}),[translateAllEpoch,setTranslateAllEpoch]=useState(0);
  const wordGuard=useRef(createSequenceGuard());
  const wordQuery=useRef<{surface:string;context:string;questionId:string|null}|null>(null);
  const wordCache=useMemo(()=>new WordCache({storage:typeof window!=="undefined"?window.localStorage:null}),[]);
  const wordEngine=useMemo(()=>new WordLookupEngine({cache:wordCache,lexicon:(s:string,c:string)=>peekLocal(s,c),timeoutMs:15_000,fetcher:async(request,signal)=>{const response=await fetch("/api/vocabulary/lookup",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(request),signal});const body:any=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body?.error||"词典查询暂不可用");return body}}),[wordCache]);
  const [submitAsync,setSubmitAsync]=useState<SubmitAsyncState>({attempt:"idle",guidance:"idle",coach:"idle"});
  const [guidanceLive,setGuidanceLive]=useState<Record<string,any>>({});
  // Answers are prefetched as soon as a question is opened, so submitting does not
  // start a 20-40 s network round. Nothing is rendered before the learner submits.
  const guidanceLoaded=useRef<Set<string>>(new Set());
  const guidanceState=useRef<Map<string,"idle"|"loading"|"ready"|"unverified">>(new Map());
  const [fetchedDual,setFetchedDual]=useState<any>(null);
  const attemptPayload=useRef<any>(null);
  const activeQuestionId=useRef<string|null>(null);
  const corpusState=useRef<"idle"|"loading"|"ready">("idle");
  const recentAnswers=useRef(new Map<string,{selected:string;confidence:string;result:any;status:"saving"|"synced"|"error";payload:any}>());
  // Phase 1 (critical) is the only request on the first-paint path.  Phase 2
  // (deferred) brings Question Map totals, the Knowledge Graph and chapter
  // mapping after the shell is already on screen.
  function mergePatch(patch:any){setData((current:any)=>{if(!current)return patch;const next:any={...current};for(const [key,value] of Object.entries(patch))if(value!==null&&value!==undefined)next[key]=value;return next})}
  async function loadCritical(){
    const response=await fetch("/api/bootstrap?scope=critical",{cache:"no-store"});
    const body:any=await response.json();
    if(redirectToSignIn(response))return;
    if(!response.ok)throw new Error(body.error||"Unable to load");
    mergePatch(body);
    const requestedId=new URLSearchParams(window.location.search).get("questionId");
    // The rotation shown to the learner is filtered by question source, but
    // `body.questions` is the whole rotation, so an index taken here would point
    // at a different question as soon as a source scope is active.  Remember the
    // id instead and resolve it against the list that is actually rendered.
    if(requestedId){pendingQuestionId.current=requestedId;setTab("practice")}
  }
  async function loadDeferred(){
    setDeferredState("loading");
    try{
      const response=await fetch("/api/bootstrap?scope=deferred",{cache:"no-store"});
      const body:any=await response.json();
      if(redirectToSignIn(response))return;
      if(!response.ok)throw new Error(body.error||"Unable to load");
      mergePatch(body);setDeferredState("ready");
    }catch{setDeferredState("error")}
  }
  async function refreshUserState(){
    try{
      const response=await fetch("/api/bootstrap?scope=user",{cache:"no-store"});
      const body:any=await response.json();
      if(redirectToSignIn(response))return;
      if(!response.ok)throw new Error(body.error||"Unable to load");
      mergePatch(body);
    }catch{}
  }
  async function load(){
    setError("");
    try{await loadCritical()}catch(e:any){setError(e.message||"Study system unavailable")}
    void loadDeferred();
  }
  useEffect(()=>{void load()},[]);
  useEffect(()=>{if(data)positionsRef.current={...readLocalPositions(),...(data.practicePositions??EMPTY_POSITIONS)}},[data?.practicePositions]);
  // The practice rotation is filtered by question source before anything else, so
  // "what can I practise" and "where did I stop" both follow the chosen scope.
  const sourceQuestions=useMemo(()=>{const rows=data?.questions??[];return sourceScope==="all"?rows:rows.filter((question:any)=>sourceScopeKey(question.source_provider)===sourceScope)},[data?.questions,sourceScope]);
  const scopePositionKey=sourceScope==="all"?"all":`all|source:${sourceScope}`;
  const allQuestions=data?.questions??[]; const questions=sourceQuestions; const allOptions=data?.options??[]; const currentQueueItem=queueItems[queuePos]; const q=currentQueueItem?questions.find((question:any)=>question.id===currentQueueItem.questionId)??null:questions[questionIndex]??null;
  // A deep link is honoured once the scope-filtered rotation is available, so the
  // id is resolved against exactly the list the learner is shown.
  useEffect(()=>{const id=pendingQuestionId.current;if(!id||!questions.length)return;const index=questions.findIndex((question:any)=>question.id===id);if(index>=0){setQueueItems([]);setQueuePos(0);setQuestionIndex(index);restoreAnswer(questions[index])}pendingQuestionId.current=null},[questions]);
  // Options are indexed once instead of re-filtering the whole corpus per question.
  const optionsByQuestion=useMemo(()=>{const map=new Map<string,any[]>();for(const option of allOptions){const list=map.get(option.question_id);if(list)list.push(option);else map.set(option.question_id,[option])}return map},[allOptions]);
  const options=optionsByQuestion.get(q?.id)??[];
  const effectiveVisual=resolveSafeVisualOverlay(q?.id,q?.image_ref);
  const attempts=data?.attempts??[];
  const coaches=data?.coaches??[];
  // The only source of a "current answer" is a published row in
  // current_answer_versions, delivered by bootstrap as a dual-answer view.
  // Questions with no published version resolve to REVIEW REQUIRED.
  const dualById=useMemo(()=>{const map=new Map<string,any>();for(const row of (data?.currentGuidance??[]))if(row?.question_id)map.set(row.question_id,row);return map},[data?.currentGuidance]);
  const guidanceById=useMemo(()=>{const map=new Map<string,Guidance>();for(const question of questions)map.set(question.id,guidanceFromDualAnswer(question,optionsByQuestion.get(question.id)??[],dualById.get(question.id)??null));return map},[questions,optionsByQuestion,dualById]);
  // AI Coach is generated per question on demand, in native Chinese, and cached server-side.
  const coachByQuestion=useMemo(()=>{const map=new Map<string,{coach:AmcCoach;evidence:any}>();for(const row of coaches){const parsed=safeJson<any>(row.result_json,null);const coach=parsed&&parsed.coach&&Array.isArray(parsed.coach.cues)?parsed.coach:parsed;if(coach&&Array.isArray(coach.cues))map.set(row.question_id,{coach:coach as AmcCoach,evidence:parsed?.evidence??null})}return map},[coaches]);
  const providerOf=useMemo(()=>{const map=new Map<string,string>();for(const question of (data?.questions??[]))map.set(question.id,sourceScopeKey(question.source_provider));return map},[data?.questions]);
  const emidiciAttempts=useMemo(()=>attempts.filter((a:any)=>providerOf.get(a.question_id)==="emidici"),[attempts,providerOf]);
  const legacyAttempts=useMemo(()=>attempts.filter((a:any)=>providerOf.get(a.question_id)==="legacy"),[attempts,providerOf]);
  // Emidici is the primary bank, so the headline numbers are computed from Emidici only.
  // Legacy usable is reported separately and never moves the primary percentage.
  const stats=useMemo(()=>{const build=(rows:any[])=>{const total=rows.length,correct=rows.filter((a:any)=>a.correct).length,confident=rows.filter((a:any)=>a.confidence==="confident"),confidentCorrect=confident.filter((a:any)=>a.correct).length,avg=total?Math.round(rows.reduce((s:number,a:any)=>s+a.elapsed_ms,0)/total/1000):0;return {total,accuracy:total?Math.round(correct/total*100):0,confAcc:confident.length?Math.round(confidentCorrect/confident.length*100):0,avg,highWrong:rows.filter((a:any)=>!a.correct&&a.confidence==="confident").length,guessCorrect:rows.filter((a:any)=>a.correct&&a.confidence==="guess").length,uncertainCorrect:rows.filter((a:any)=>a.correct&&a.confidence==="uncertain").length}};return {...build(emidiciAttempts),source:"emidici",legacy:build(legacyAttempts),all:build(attempts)}},[emidiciAttempts,legacyAttempts,attempts]);
  const insights=useMemo(()=>buildInsights(data?.nodes??[], attempts, data?.links??[], data?.reviews??[]),[data?.nodes,attempts,data?.links,data?.reviews]);
  const nodePriority=insights.assessed.sort((a:any,b:any)=>b.priority-a.priority)[0];
  const currentGuidance=q?guidanceById.get(q.id)??null:null;
  const currentDual=q?(fetchedDual&&fetchedDual.question_id===q.id?fetchedDual:dualById.get(q.id)??null):null;
  const currentFlags:Record<string,boolean>=data?.flags??{CURRENT_GUIDANCE_UI:true,AI_COACH:true};
  // Word lookup is now a two-stage read: whatever is already local paints on the
  // same tick, and only a genuinely unknown word waits for the server. A monotonically
  // increasing sequence guard means a late response for an older word is dropped.
  function requestWord(surface:string,context:string,questionId:string|null){
    const seq=wordGuard.current.next();wordQuery.current={surface,context,questionId};
    const key=wordCacheKey(surface,context);
    const cached=wordCache.get(key);
    if(cached){setWordPanel({surface,status:"ready",word:cached.word,layer:cached.layer,latencyMs:0,queryKey:key});return}
    setWordPanel({surface,status:"loading",queryKey:key});
    void (async()=>{
      try{await loadLexicon()}catch{}
      if(!wordGuard.current.isCurrent(seq))return;
      const outcome=await wordEngine.lookup(surface,context,questionId);
      if(!wordGuard.current.isCurrent(seq))return;
      setWordPanel(outcome.ok?{surface,status:"ready",word:outcome.word,layer:outcome.layer,latencyMs:outcome.latencyMs,queryKey:key}:{surface,status:"error",error:outcome.error,retryable:outcome.retryable,latencyMs:outcome.latencyMs,queryKey:key});
    })();
  }
  function openWord(surface:string,questionId:string|null){
    const context=questionId===q?.id?[q?.stem_en,...options.map((option:any)=>option.text_en)].filter(Boolean).join("\n"):"";
    setSourceQuestionId(questionId);setWordCollapsed(typeof window!=="undefined"&&window.matchMedia("(max-width:900px)").matches);requestWord(surface,context,questionId);
  }
  function retryWord(){const query=wordQuery.current;if(query)requestWord(query.surface,query.context,query.questionId)}
  function closeWord(){wordGuard.current.invalidate();setWordPanel(null);setWordPinned(false)}
  useEffect(()=>{warmLexicon()},[]);
  // A question switch invalidates every in-flight lookup immediately.
  useEffect(()=>{if(!q?.id)return;wordGuard.current.invalidate();wordQuery.current=null;setWordPanel(null);setWordCollapsed(false)},[q?.id]);
  // Wordbook is optimistic and idempotent.  It never reloads the Study OS and
  // never re-initialises the shell; a failed write rolls the row back.
  function setVocabularyRows(updater:(rows:any[])=>any[]){setData((current:any)=>current?{...current,vocabulary:updater(current.vocabulary??[])}:current)}
  async function addWord(){const current=wordPanel?.word;if(!current)return;const lemma=current.lemma;setSavingWord(true);setError("");const snapshot=data?.vocabulary??[];const optimistic={id:`pending:${lemma}`,user_id:"",lemma,surface_form:wordPanel?.surface??current.lemma,part_of_speech:current.partOfSpeech,translation_zh:current.translationZh,contextual_meaning_zh:current.contextualMeaningZh,morphology_zh:current.morphologyZh,etymology_zh:current.etymologyZh,mnemonic_zh:current.mnemonicZh,source_question_id:sourceQuestionId,created_at:new Date().toISOString(),due_at:new Date(Date.now()+86400000).toISOString(),status:"learning"};setVocabularyRows(rows=>[optimistic,...rows.filter((row:any)=>row.lemma!==lemma)]);const payload=JSON.stringify({lemma:current.lemma,surfaceForm:wordPanel?.surface??current.lemma,partOfSpeech:current.partOfSpeech??"",translationZh:current.translationZh||current.lemma,contextualMeaningZh:current.contextualMeaningZh??"",morphologyZh:current.morphologyZh??"",etymologyZh:current.etymologyZh??"",mnemonicZh:current.mnemonicZh??"",sourceQuestionId:sourceQuestionId??null,sourceContext:String(q?.stem_en??"").slice(0,1000)});
    try{
      // One retry on a 5xx/network blip: a transient failure used to revert the
      // button to "加入词汇本" a few seconds after the word looked saved.
      let response=await fetch("/api/vocabulary",{method:"POST",headers:{"content-type":"application/json"},body:payload});
      if(!response.ok)response=await fetch("/api/vocabulary",{method:"POST",headers:{"content-type":"application/json"},body:payload});
      if(!response.ok)throw new Error(`save ${response.status}`);
    }catch{setVocabularyRows(()=>snapshot);setError("词汇暂未加入单词本；状态已回滚，你的作答数据不受影响。")}finally{setSavingWord(false)}}
  async function removeWord(lemma:string){setSavingWord(true);setError("");const snapshot=data?.vocabulary??[];setVocabularyRows(rows=>rows.filter((row:any)=>row.lemma!==lemma));try{const response=await fetch("/api/vocabulary",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({lemma})});if(!response.ok)throw new Error()}catch{setVocabularyRows(()=>snapshot);setError("移出单词本暂未成功；状态已回滚。") }finally{setSavingWord(false)}}
  const vocabularyLemmaSet=useMemo(()=>new Set((data?.vocabulary??[]).map((row:any)=>row.lemma)),[data?.vocabulary]);
  const wordSavedInBook=Boolean(wordPanel?.word&&vocabularyLemmaSet.has(wordPanel.word.lemma));
  function syncNote(note:NoteRow|null,scopeKey:string){setData((current:any)=>{const others=(current?.notes??[]).filter((row:NoteRow)=>row.scope_key!==scopeKey);return {...current,notes:note?[note,...others]:others}})}
  function applyDual(body:any,questionId:string){if(!body?.dual)return;setData((current:any)=>{const others=(current?.currentGuidance??[]).filter((row:any)=>row.question_id!==questionId);return {...current,currentGuidance:[body.dual,...others]}})}
  /** Forced live re-check: the only path that asks the network again on demand. */
  async function refreshGuidance(questionId:string){
    setGuidanceLive((state)=>({...state,[questionId]:{status:"CHECKING",fetchedThisRound:false,reason:"正在联网核验…"}}));
    try{
      const response=await fetch(`/api/current-guidance?questionId=${encodeURIComponent(questionId)}&refresh=1`);
      const body:any=await response.json();
      if(!response.ok)throw new Error(body?.error||"guide check failed");
      if(body?.live)setGuidanceLive((state)=>({...state,[questionId]:body.live}));
      if(body?.dual)applyDual(body,questionId);
    }catch(error:any){
      setGuidanceLive((state)=>({...state,[questionId]:{status:"VERIFICATION_UNAVAILABLE",reason:`联网请求失败：${String(error?.message??error).slice(0,80)}`}}));
    }
  }
  // Reads the single published current-answer version from the database.  It
  // performs no live retrieval, so submitting an answer never depends on a
  // search API.
  async function loadGuidance(questionId:string,force=false){
    if(!force&&guidanceLoaded.current.has(questionId)){
      setSubmitAsync((state)=>({...state,guidance:guidanceState.current.get(questionId)??"ready"}));
      return;
    }
    setSubmitAsync((state)=>({...state,guidance:"loading"}));
    const fresh=questionId!==activeQuestionId.current;
    try{
      const r=await fetch(`/api/current-guidance?questionId=${encodeURIComponent(questionId)}&refresh=1`);
      const body:any=await r.json();
      if(r.ok&&body?.live)setGuidanceLive((state)=>({...state,[questionId]:body.live}));
      if(r.ok&&body?.dual){
        applyDual(body,questionId);
        const next=body.state==="REVIEW_REQUIRED"?"unverified":"ready";
        guidanceLoaded.current.add(questionId);
        guidanceState.current.set(questionId,next);
        if(!fresh){setFetchedDual(body.dual);setSubmitAsync((state)=>({...state,guidance:next}))}
      }else if(!fresh)setSubmitAsync((state)=>({...state,guidance:"unverified"}));
    }catch{if(!fresh)setSubmitAsync((state)=>({...state,guidance:"unverified"}))}
  }
  async function saveAttempt(payload:any){setSubmitAsync((state)=>({...state,attempt:"saving"}));try{const r=await fetch("/api/attempt",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const body:any=await r.json();if(!r.ok)throw new Error(body.error);const recent=recentAnswers.current.get(payload.questionId);if(recent)recentAnswers.current.set(payload.questionId,{...recent,result:{...recent.result,...body,pending:false},status:"synced"});if(activeQuestionId.current===payload.questionId){setResult((current:any)=>({...current,...body,pending:false}));setSubmitAsync((state)=>({...state,attempt:"synced"}))}}catch{const recent=recentAnswers.current.get(payload.questionId);if(recent)recentAnswers.current.set(payload.questionId,{...recent,status:"error"});if(activeQuestionId.current===payload.questionId)setSubmitAsync((state)=>({...state,attempt:"error"}))}}
  function retryAttempt(){if(attemptPayload.current)void saveAttempt(attemptPayload.current)}
  // Signing out must end BOTH sessions: the WorkBuddy cloud session and this
  // site's own cookie.  Ending only one would leave the page able to restore the
  // other, which is not a logout.
  async function signOut(){
    try{const {getCloud}=await import("@/lib/cloud-client");await getCloud().auth.signOut()}catch{}
    try{await fetch("/api/session",{method:"DELETE"})}catch{}
    window.location.assign("/login")
  }
  function submit(){if(!selected||!q||result)return;const scrollY=window.scrollY,correct=selected===q.answer_key,clientAttemptId=crypto.randomUUID();const payload={questionId:q.id,selectedAnswer:selected,confidence,elapsedMs:Date.now()-started,sessionId:"study-session",clientAttemptId};const immediate={ok:true,pending:true,attemptId:clientAttemptId,correct,answerKey:q.answer_key,evidenceType:attemptEvidenceType(correct,confidence)};activeQuestionId.current=q.id;attemptPayload.current=payload;recentAnswers.current.set(q.id,{selected,confidence,result:immediate,status:"saving",payload});setResult(immediate);const warmGuidance=guidanceLoaded.current.has(q.id),warmCoach=coachByQuestion.has(q.id);setSubmitAsync({attempt:"saving",guidance:warmGuidance?(guidanceState.current.get(q.id)??"ready"):"loading",coach:warmCoach?"ready":"loading"});setGuidanceLive((state)=>({...state,[q.id]:{status:"CHECKING",reason:"正在联网核验澳洲权威来源…"}}));requestAnimationFrame(()=>{window.scrollTo(0,scrollY);if(activeQuestionId.current===q.id)setSubmitAsync((state)=>({...state,coach:"ready"}))});const questionId=q.id;void Promise.allSettled([saveAttempt(payload),loadGuidance(questionId)]).then(()=>{void refreshUserState()});void ensureCoach(questionId)}
  // Per-question source text and the AMC coach are both loaded off the critical
  // path, so a cold open never waits for the corpus or for the model.
  // The list payload is an INDEX (identity + small filter fields).  Everything a
  // question actually renders — stem, options, source-era text — arrives here, per
  // question, and is merged back into the same lists the rest of the screen already
  // reads, so no consumer had to change.  `questionBodies` is the browser-side LRU
  // (keyed by id + content hash) that makes next/previous instant without ever
  // re-introducing cross-question staleness: a body is only ever merged into the row
  // whose id it belongs to.
  async function ensureQuestionDetail(questionId:string){if(!questionId||detailRequested.current.has(questionId))return;detailRequested.current.add(questionId);try{const response=await fetch(`/api/question-detail?id=${encodeURIComponent(questionId)}`,{cache:"no-store"});const payload:any=await response.json();if(!response.ok)throw new Error(payload.error);const detail=payload.question;setData((current:any)=>{if(!current)return current;const bodies:Record<string,any>={...(current.questionBodies??{})};bodies[detail.id]={hash:payload.content_hash,at:Date.now()};const keys=Object.keys(bodies);if(keys.length>DETAIL_CACHE_MAX){for(const stale of keys.sort((a,b)=>bodies[a].at-bodies[b].at).slice(DETAIL_CACHE_MAX))delete bodies[stale]}const keep=new Set(Object.keys(bodies));const otherOptions=(current.options??[]).filter((option:any)=>option.question_id!==detail.id&&keep.has(option.question_id));return {...current,questionBodies:bodies,questions:(current.questions??[]).map((question:any)=>question.id===detail.id?{...question,stem_en:detail.stem_en??question.stem_en,stem_zh:detail.stem_zh??question.stem_zh,answer_key:detail.answer_key??question.answer_key,image_ref:detail.image_ref??question.image_ref,source_explanation_en:detail.source_explanation_en,memory_rule_en:detail.memory_rule_en,current_answer:detail.current_answer,current_answer_status:detail.current_answer_status,current_evidence_json:detail.current_evidence_json}:question),options:[...otherOptions,...(detail.options??[])]}})}catch{detailRequested.current.delete(questionId)}}
  // Only the tabs that genuinely need the whole bank ask for it, and only when opened.
  async function loadCorpus(){if(corpusState.current!=="idle")return;corpusState.current="loading";try{const response=await fetch("/api/bootstrap?scope=corpus",{cache:"no-store"});const payload:any=await response.json();if(!response.ok)throw new Error(payload.error||"corpus unavailable");setData((current:any)=>current?{...current,questions:payload.questions??current.questions,options:payload.options??current.options}:current);corpusState.current="ready"}catch{corpusState.current="idle"}}
  async function ensureCoach(questionId:string,force=false){if(!questionId)return;if(!force&&coachByQuestion.has(questionId))return;setCoachStates((current)=>({...current,[questionId]:{status:"loading"}}));try{const response=await fetch("/api/question-coach",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({questionId})});const body:any=await response.json();if(!response.ok)throw new Error(body.error||"AI Coach 暂时不可用");setData((current:any)=>current?{...current,coaches:[{question_id:questionId,evidence_status:`source-era-only:${body.evidence?.level??"RICH"}`,result_json:JSON.stringify({version:body.version,coach:body.coach,evidence:body.evidence}),source_list_json:"[]",searched_at:null},...(current.coaches??[]).filter((row:any)=>row.question_id!==questionId)]}:current);setCoachStates((current)=>({...current,[questionId]:{status:"ready"}}))}catch(error:any){setCoachStates((current)=>({...current,[questionId]:{status:"error",error:error.message||"AI Coach 生成失败，请点击重新生成。"}}))}}
  function recordPosition(questionId:string,baseScope="all"){if(!questionId)return;const practiceScope=sourceScope==="all"?baseScope:`${baseScope}|source:${sourceScope}`;const next={questionId,practiceScope,updatedAt:new Date().toISOString()};positionsRef.current={...positionsRef.current,[practiceScope]:next};writeLocalPosition(questionId,practiceScope);clearTimeout(positionTimer.current);positionTimer.current=setTimeout(()=>{void fetch("/api/practice-position",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({questionId,practiceScope})}).catch(()=>{})},600)}
  // Warm both slow endpoints while the learner is reading the question.
  useEffect(()=>{
    const id=q?.id;
    if(!id||result)return;
    const timer=setTimeout(()=>{ void loadGuidance(id); void ensureCoach(id); },400);
    return ()=>clearTimeout(timer);
  },[q?.id,result]);
  function resetAnswer(clearCurrent=true){if(clearCurrent&&q)recentAnswers.current.delete(q.id);setSelected("");setConfidence("uncertain");setResult(null);setFetchedDual(null);setSubmitAsync({attempt:"idle",guidance:"idle",coach:"idle"});attemptPayload.current=null;setStarted(Date.now())}
  function restoreAnswer(question:any){activeQuestionId.current=question?.id??null;attemptPayload.current=null;const recent=recentAnswers.current.get(question?.id);if(recent){setSelected(recent.selected);setConfidence(recent.confidence);setResult(recent.result);setSubmitAsync({attempt:recent.status,guidance:"ready",coach:"ready"});attemptPayload.current=recent.status==="error"?recent.payload:null;return}const last=attempts.filter((attempt:any)=>attempt.question_id===question?.id).sort((a:any,b:any)=>b.attempted_at.localeCompare(a.attempted_at)||b.id.localeCompare(a.id))[0];if(last){setSelected(last.selected_answer);setConfidence(last.confidence);setResult({ok:true,correct:Boolean(last.correct),answerKey:question.answer_key,evidenceType:last.error_type??attemptEvidenceType(Boolean(last.correct),last.confidence),attemptId:last.id});setSubmitAsync({attempt:"synced",guidance:"ready",coach:"ready"})}else resetAnswer(false)}
  function navigateToQuestion(id:string){const index=questions.findIndex((question:any)=>question.id===id);if(index<0)return;setQueueItems([]);setQueuePos(0);setQuestionIndex(index);restoreAnswer(questions[index]);setTab("practice")}
  function move(direction:-1|1){if(queueItems.length){const target=queuePos+direction;if(target<0||target>=queueItems.length)return;setQueuePos(target);restoreAnswer(questions.find((question:any)=>question.id===queueItems[target].questionId));return}const target=questionIndex+direction;if(target<0||target>=questions.length)return;setQuestionIndex(target);restoreAnswer(questions[target])}
  function next(){move(1)}
  function previous(){move(-1)}
  function startTargeted(kind:"adaptive"|"guideline"="adaptive",nodeId?:string,conceptId?:string){const queue=kind==="guideline"?buildGuidelineQueue(questions,guidanceById):buildTargetedQueue(questions,attempts,data?.links??[],data?.reviews??[],guidanceById,nodeId,data?.conceptMappings??[],data?.conceptReviews??[],conceptId);if(!queue.length){setError(kind==="guideline"?"目前没有已经核验且发生更新的题目。":"当前范围没有可进入专项队列的题目。");return}setQueueItems(queue);setQueuePos(0);activeQuestionId.current=queue[0].questionId;resetAnswer(false);setTab("practice")}
  function startChapterPractice(chapterId:string){const ids=new Set((data?.conceptMappings??[]).filter((mapping:any)=>mapping.chapter_id===chapterId).map((mapping:any)=>mapping.question_id));const queue=questions.filter((question:any)=>ids.has(question.id)).map((question:any)=>({questionId:question.id,reason:"Chapter practice",score:0}));if(!queue.length)return;setQueueItems(queue);setQueuePos(0);activeQuestionId.current=queue[0].questionId;resetAnswer(false);setTab("practice")}
  // Resume: continue from the stored practice position.  A remembered question
  // that is no longer practiceable advances to the next unanswered question
  // inside the same scope instead of silently restarting at the first item.
  function resumeOrStart(kind:"adaptive"|"guideline"="adaptive"){
    if(!questions.length){startTargeted(kind);return}
    const stored=positionsRef.current[scopePositionKey]??readLocalPositions()[scopePositionKey]??null;
    const remembered=typeof stored?.questionId==="string"?stored.questionId:attempts.find((attempt:any)=>questions.some((question:any)=>question.id===attempt.question_id))?.question_id??null;
    const attemptedIds=new Set(attempts.map((attempt:any)=>attempt.question_id));
    let index=remembered?questions.findIndex((question:any)=>question.id===remembered):-1;
    let hint:any=null;
    if(index>=0){
      hint={text:`已续接上次位置（第 ${index+1} 题）`};
    }else if(remembered){
      const next=questions.findIndex((question:any)=>!attemptedIds.has(question.id));
      index=next>=0?next:0;
      hint={text:"上次的题现在不可练；已跳到本范围内下一道尚未完成的题。",stale:true};
    }else{
      const next=questions.findIndex((question:any)=>!attemptedIds.has(question.id));
      index=next>=0?next:0;
      hint=null;
    }
    setQueueItems([]);setQueuePos(0);setQuestionIndex(index);restoreAnswer(questions[index]);setTab("practice");setResumeHint(hint);
  }
  // Switching the question source re-enters the rotation at the position stored
  // for that source; it never inherits or overwrites another source's cursor.
  function changeSourceScope(next:string){
    if(next===sourceScope)return;
    setSourceScope(next);writeStoredSourceScope(next);
    setQueueItems([]);setQueuePos(0);setQuestionIndex(0);resetAnswer(false);
    const label=SOURCE_SCOPE_OPTIONS.find((option)=>option.key===next)?.label??next;
    const stored=positionsRef.current[next==="all"?"all":`all|source:${next}`];
    setResumeHint({text:stored?`已切换到题源「${label}」；该题源有独立记录的练习位置，点「继续刷题」即可续接。`:`已切换到题源「${label}」。刷题与续接位置按题源独立记录。`});
  }
  function restartPractice(){
    clearLocalPosition(scopePositionKey);const {[scopePositionKey]:_dropped,...remaining}=positionsRef.current;positionsRef.current=remaining;
    void fetch(`/api/practice-position?scope=${encodeURIComponent(scopePositionKey)}`,{method:"DELETE"}).catch(()=>{});
    if(!questions.length){startTargeted("adaptive");return}
    setQueueItems([]);setQueuePos(0);setQuestionIndex(0);resetAnswer(false);setTab("practice");
    setResumeHint({text:"已重新开始：位置已清零，从第 1 题开始。"});
  }
  const activeChapterId=(data?.conceptMappings??[]).find((row:any)=>row.question_id===q?.id)?.chapter_id??null;
  const currentEntry=coachByQuestion.get(q?.id??"")??null;
  const currentCoach=currentEntry?.coach??null;
  const currentCoachState=coachStates[q?.id??""]??{status:currentCoach?"ready":"idle"} as {status:"idle"|"loading"|"ready"|"error";error?:string};
  // Remember where the learner is and pull the per-question source text.
  useEffect(()=>{if(tab!=="practice"||!q?.id)return;recordPosition(q.id,queueItems.length?"queue:"+(currentQueueItem?.reason??""):"all")},[tab,q?.id,sourceScope]);
  // Prefetch the neighbours so next/previous is instant, bounded to +-2 so a burst of
  // clicks can never turn into a corpus download.
  useEffect(()=>{if(!q?.id)return;void ensureQuestionDetail(q.id);const order=queueItems.length?queueItems.map((item)=>item.questionId):questions.map((question:any)=>question.id);const at=order.indexOf(q.id);if(at<0)return;for(const offset of [1,-1,2]){const neighbour=order[at+offset];if(neighbour)void ensureQuestionDetail(neighbour)}},[q?.id,queueItems]);
  // The shell renders immediately from the app frame; only the data areas wait.
  if(!data)return <BootShell error={error} onRetry={()=>void load()}/>;
  return <main className="app-shell"><header className="topbar"><div className="brand"><span className="brand-mark"><Activity size={19}/></span><div><b>AMC Study OS</b><small>Evidence-gated Learning Engine</small></div></div><div className="top-status"><Button size="sm" variant="outline" onClick={()=>setTranslateAllEpoch((value)=>value+1)}><Languages/>全页翻译</Button><Badge variant="outline">Private</Badge><span>{data?.user?.displayName}</span><Button size="sm" variant="outline" onClick={()=>void signOut()}>退出登录</Button></div></header>{error&&<div className="errorbar"><TriangleAlert size={16}/>{error}<button onClick={()=>setError("")}>关闭</button></div>}
    <Tabs value={tab} onValueChange={(next:string)=>{setTab(next);if(["mistakes","updates","knowledge","question-map"].includes(next))void loadCorpus()}} className="workspace"><TabsList className="nav" aria-label="AMC Study OS navigation"><TabsTrigger value="dashboard"><Target/>总览</TabsTrigger><TabsTrigger value="practice"><BookOpen/>刷题</TabsTrigger><TabsTrigger value="question-map"><MapIcon/>题目总览</TabsTrigger><TabsTrigger value="review"><CalendarClock/>复习</TabsTrigger><TabsTrigger value="updates"><RefreshCw/>指南更新</TabsTrigger><TabsTrigger value="mistakes"><TriangleAlert/>错题</TabsTrigger><TabsTrigger value="vocabulary"><Languages/>词汇</TabsTrigger><TabsTrigger value="notes"><StickyNote/>笔记</TabsTrigger><TabsTrigger value="knowledge"><BrainCircuit/>知识库</TabsTrigger><TabsTrigger value="library"><Library/>资料库</TabsTrigger><a className="tb-nav-link" href="/textbook"><BookOpen/>教科书</a></TabsList>
      <TabsContent value="dashboard"><Dashboard stats={stats} reviews={data?.reviews??[]} node={nodePriority} insights={insights} onPractice={()=>resumeOrStart("adaptive")} onRestart={restartPractice} resumeLabel="重新开始"/></TabsContent>
      <TabsContent value="practice"><div className="source-scope-bar practice" role="group" aria-label="题源 / Question Source"><span className="source-scope-label">Question Bank / 题库</span>{SOURCE_SCOPE_OPTIONS.map((option)=><button type="button" key={option.key} className={cn("source-scope-option",option.key===sourceScope&&"active")} aria-pressed={option.key===sourceScope} onClick={()=>changeSourceScope(option.key)}>{option.label}</button>)}<span className="source-scope-count">本范围 {questions.length} 道可练</span></div>{resumeHint&&<p className={cn("resume-hint",resumeHint.stale&&"stale")} role="status">{resumeHint.text}<button type="button" onClick={()=>setResumeHint(null)} aria-label="关闭提示" style={{marginLeft:"auto",border:0,background:"transparent",cursor:"pointer",color:"inherit"}}>关闭</button></p>}{!q?<p className="empty">暂无可安全判分的题目。</p>:<section className={cn("practice-grid",(wordPanel||wordPinned)&&"has-word-panel")}><article className="question-card"><div className="eyebrow"><span>{q.domain} · {q.clinical_task}</span><span>{currentQueueItem?`${currentQueueItem.reason} · ${queuePos+1}/${queueItems.length}`:"按原书计时"}</span></div>{currentQueueItem&&<MiniTranslation key={`mini:targeted-reason:${q.id}`} kind="targeted-reason" blocks={[{type:"paragraph",text:currentQueueItem.reason}]} translateAllEpoch={translateAllEpoch}/>}<QuestionTranslation key={`question-translation:${q.id}`} question={q} options={options} translateAllEpoch={translateAllEpoch}/><h1>{q.stem_en?<Assist text={q.stem_en} zh={q.stem_zh} id="stem" showZh={showZh} setShowZh={setShowZh} onWord={(w)=>openWord(w,q.id)}/>:<span className="stem-skeleton" role="status" aria-live="polite"><span className="bar"/><span className="bar w70"/><span className="visually-hidden">正在载入题干…</span></span>}</h1>{effectiveVisual.effectiveVisualQuestion&&effectiveVisual.effectiveVisualAsset&&<VisualAsset url={effectiveVisual.effectiveVisualAsset} questionId={q.id} translateAllEpoch={translateAllEpoch}/>}<div className="options">{options.length?options.map((o:any)=><div key={o.id} role="button" tabIndex={result?-1:0} aria-pressed={selected===o.option_key} onKeyDown={(e)=>{if(!result&&(e.key==="Enter"||e.key===" "))setSelected(o.option_key)}} onClick={()=>!result&&setSelected(o.option_key)} className={cn("option",selected===o.option_key&&"selected",result&&o.option_key===q.answer_key&&"correct",result&&selected===o.option_key&&o.option_key!==q.answer_key&&"incorrect")}><b>{o.option_key}</b><span><Assist text={o.text_en} zh={o.text_zh} id={`opt-${o.id}`} showZh={showZh} setShowZh={setShowZh} onWord={(w)=>openWord(w,q.id)}/></span></div>):[0,1,2,3].map((i:number)=><div className="option option-ghost" key={`ghost-${i}`}><b>{String.fromCharCode(65+i)}</b><span><span className="bar"/></span></div>)}</div><div className="confidence"><span>本题把握</span>{[["confident","确定"],["uncertain","犹豫"],["guess","猜"]].map(([v,label])=><button key={v} onClick={()=>setConfidence(v)} className={confidence===v?"active":""} disabled={!!result}>{label}</button>)}</div><div className="question-nav-actions"><Button size="lg" variant="outline" disabled={queueItems.length?queuePos===0:questionIndex===0} onClick={previous}>上一题</Button>{!result?<Button size="lg" disabled={!selected} onClick={submit}>提交答案</Button>:<Button size="lg" variant="outline" onClick={()=>resetAnswer()}>再次作答</Button>}<Button size="lg" variant="outline" disabled={queueItems.length?queuePos>=queueItems.length-1:questionIndex>=questions.length-1} onClick={next}>下一题</Button></div>{result&&<div className={cn("attempt-sync",submitAsync.attempt==="error"&&"error")} role="status">{submitAsync.attempt==="saving"&&<>答案已显示 · 正在同步学习记录…</>}{submitAsync.attempt==="synced"&&<>学习记录已同步</>}{submitAsync.attempt==="error"&&<>答案已保留，学习记录暂未同步。<button onClick={retryAttempt}>重试同步</button></>}</div>}</article>
        <aside className="study-side"><section className="panel timer"><Clock3/><b>{Math.floor((Date.now()-started)/1000)}s</b><span>答案与证据在提交后显示</span></section>{result&&currentGuidance&&<><AnswerComparison key={`answer-comparison:${q.id}`} question={q} options={options} result={result} guidance={currentGuidance} dual={currentDual} translateAllEpoch={translateAllEpoch}/>{!currentFlags.CURRENT_GUIDANCE_UI?null:<CurrentEvidence guidance={currentGuidance} dual={currentDual} questionId={q.id} live={guidanceLive[q.id]} onRetry={()=>void refreshGuidance(q.id)} translateAllEpoch={translateAllEpoch}/>}</>}</aside></section>}{result&&currentGuidance&&<div className="practice-wide-stack"><section className="panel panel-wide">{q.source_explanation_en?<FullExplanation title="SOURCE-ERA EXPLANATION" buttonLabel="原文解释翻译" questionId={q.id} explanationType="source-era" blocks={blocksFromText(q.source_explanation_en)} state={translations[`source-era:${q.id}`]} setState={setTranslations} onWord={(w)=>openWord(w,q.id)} translateAllEpoch={translateAllEpoch}/>:<AsyncPanel title="SOURCE-ERA EXPLANATION · 原文解释" text="正在载入原题解析…"/>}{q.source_explanation_en&&isUsefulMemoryRule(q.memory_rule_en)&&<FullExplanation title="MEMORY RULE" buttonLabel="原文解释翻译" questionId={q.id} explanationType="memory-rule" blocks={blocksFromText(q.memory_rule_en)} state={translations[`memory-rule:${q.id}`]} setState={setTranslations} onWord={(w)=>openWord(w,q.id)} translateAllEpoch={translateAllEpoch}/>}</section>{currentFlags.AI_COACH&&<Coach coach={currentCoach} evidence={currentEntry?.evidence} state={currentCoachState} onRetry={()=>void ensureCoach(q.id,true)} onWord={(w:string)=>openWord(w,q.id)}/>}</div>}</TabsContent>
      <TabsContent value="question-map"><QuestionMap records={data?.canonicalIndex??[]} attempts={attempts} mappings={data?.canonicalLearningMappings??[]} chapters={data?.canonicalChapters??[]} currentQuestionId={q?.id} onJump={navigateToQuestion} onChapterPractice={startChapterPractice} practiceability={data?.sourcePracticeability?.[sourceScope]??data?.practiceability} loading={deferredState==="loading"} sourceScope={sourceScope} sourceOptions={SOURCE_SCOPE_OPTIONS} onSourceScopeChange={changeSourceScope}/></TabsContent>
      <TabsContent value="review"><Review reviews={data?.reviews??[]} nodes={data?.nodes??[]}/></TabsContent><TabsContent value="updates"><GuidelineUpdates questions={allQuestions} options={allOptions} guidanceById={guidanceById} nodes={data?.nodes??[]} links={data?.links??[]} onStart={()=>startTargeted("guideline")} translateAllEpoch={translateAllEpoch}/></TabsContent><TabsContent value="mistakes"><Mistakes attempts={attempts} questions={allQuestions}/></TabsContent><TabsContent value="vocabulary"><Vocabulary rows={data?.vocabulary??[]}/></TabsContent><TabsContent value="notes"><NotesView notes={data?.notes??[]} questions={allQuestions} chapters={data?.chapters??[]}/></TabsContent><TabsContent value="knowledge"><Knowledge nodes={data?.nodes??[]} reviews={data?.reviews??[]} insights={insights} questions={allQuestions} canonicalIndex={data?.canonicalIndex??[]} links={data?.links??[]} graph={data?.graph} guidanceById={guidanceById} onPractice={(nodeId:string)=>startTargeted("adaptive",nodeId)}/></TabsContent><TabsContent value="library"><LibraryView sources={data?.sources??[]} bankStats={data?.bankStats}/></TabsContent>
    </Tabs>{q&&<FloatingNotes key={`notes:${q.id}`} noteType="question" questionId={q.id} notes={data?.notes??[]} onChange={syncNote} dictOpen={Boolean(wordPanel||wordPinned)}/>}{(wordPanel||wordPinned)&&<WordPanel state={wordPanel} pinned={wordPinned} collapsed={wordCollapsed} saved={wordSavedInBook} saving={savingWord} onClose={closeWord} onTogglePin={()=>setWordPinned(v=>!v)} onToggleCollapse={()=>setWordCollapsed(v=>!v)} onAdd={()=>void addWord()} onRemove={()=>{const lemma=wordPanel?.word?.lemma;if(lemma)void removeWord(lemma)}} onRetry={retryWord}/>}{currentFlags.AI_COACH&&<AITutor question={q} selectedAnswer={selected} confidence={confidence} chapterId={activeChapterId} notes={data?.notes??[]} onNoteChange={syncNote}/>}</main>;
}
function currentEvidenceQuestion(text:string){return /\b(latest|current|today|guideline|guidance|recommend(?:ation|ed)?|dose|dosage|screen(?:ing)?|vaccin|antimicrobial|pregnan|policy|still use|australia|australian|search|verify|online|first[- ]line|emergency algorithm)\b|最新|现在|指南|推荐|首选|顺序|剂量|筛查|疫苗|抗菌|妊娠|澳洲|澳大利亚|还用|联网|查询|查一下|检索|核实|过时|急诊流程|肿瘤/i.test(text)}
function tutorBlockText(block:TutorBlock){if(block.text)return block.text;if(block.items)return block.items.join("；");if(block.rows)return block.rows.map((row)=>row.join("：")).join("；");if(block.steps)return block.steps.map((step)=>`${step.label}${step.detail?`：${step.detail}`:""}`).join("；");return ""}
function TutorBlocks({blocks}:{blocks:TutorBlock[]}){return <div className="tutor-blocks">{blocks.map((block,index)=>{const key=`${block.type}-${index}`;if(block.type==="heading")return <h3 key={key}>{block.text}</h3>;if(block.type==="paragraph")return <p key={key}>{block.text}</p>;if(block.type==="bullet_list")return <ul key={key}>{block.items?.map((item,i)=><li key={i}>{item}</li>)}</ul>;if(block.type==="numbered_list")return <ol key={key}>{block.items?.map((item,i)=><li key={i}>{item}</li>)}</ol>;if(block.type==="comparison_table"||block.type==="drug_table")return <section className="tutor-table-block" key={key}>{block.title&&<h4>{block.title}</h4>}<div className="tutor-table-wrap"><table><thead><tr>{block.columns?.map((column,i)=><th key={i}>{column}</th>)}</tr></thead><tbody>{block.rows?.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></section>;if(block.type==="algorithm")return <section className="tutor-algorithm" key={key}>{block.title&&<h4>{block.title}</h4>}<ol>{block.steps?.map((step,i)=><li key={i}><span>{i+1}</span><div><b>{step.label}</b>{step.detail&&<p>{step.detail}</p>}</div></li>)}</ol></section>;return <aside className={`tutor-callout ${block.type}`} key={key}><b>{block.title??(block.type==="exam_trap"?"AMC 高频陷阱":block.type==="takeaway"?"一句话记忆":block.type==="warning"?"注意":"Clinical pearl")}</b><p>{block.text}</p></aside>})}</div>}
function LegacyAITutor({question,selectedAnswer,confidence,chapterId,notes,onNoteChange}:{question:any;selectedAnswer:string;confidence:string;chapterId:string|null;notes:NoteRow[];onNoteChange:(note:NoteRow|null,scopeKey:string)=>void}){
  const [open,setOpen]=useState(false),[minimized,setMinimized]=useState(false),[input,setInput]=useState(""),[messages,setMessages]=useState<any[]>([]),[loading,setLoading]=useState(false),[status,setStatus]=useState("");
  const imeComposing=useRef(false),keyboardSubmitInFlight=useRef(false);
  function handleTutorKeyDown(event:globalThis.KeyboardEvent){if(event.key!=="Enter"||event.shiftKey||event.isComposing||imeComposing.current||event.keyCode===229)return;if(window.matchMedia?.("(pointer: coarse)").matches)return;event.preventDefault();if(keyboardSubmitInFlight.current)return;keyboardSubmitInFlight.current=true;void ask().finally(()=>{keyboardSubmitInFlight.current=false})}
  useEffect(()=>{if(!open)return;const isTutorInput=(target:EventTarget|null)=>target instanceof HTMLTextAreaElement&&!!target.closest(".ai-tutor");const onKeyDown=(event:globalThis.KeyboardEvent)=>{if(isTutorInput(event.target))handleTutorKeyDown(event)};const onCompositionStart=(event:CompositionEvent)=>{if(isTutorInput(event.target))imeComposing.current=true};const onCompositionEnd=(event:CompositionEvent)=>{if(isTutorInput(event.target))imeComposing.current=false};document.addEventListener("keydown",onKeyDown);document.addEventListener("compositionstart",onCompositionStart);document.addEventListener("compositionend",onCompositionEnd);return()=>{document.removeEventListener("keydown",onKeyDown);document.removeEventListener("compositionstart",onCompositionStart);document.removeEventListener("compositionend",onCompositionEnd)}},[open,input,loading,messages,question.id]);
  const ask=async(override?:string,forceEvidence=false)=>{const text=(override??input).trim();if(!text||loading)return;const nextHistory=[...messages.slice(-8),{role:"user",content:text}];setMessages(nextHistory);setInput("");setLoading(true);setStatus(currentEvidenceQuestion(text)||forceEvidence?"正在调用澳洲证据检索与 Evidence Gate…":"正在读取当前章节与 Knowledge Node…");try{const response=await fetch("/api/ai-tutor",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({questionId:question.id,message:text,selectedAnswer:selectedAnswer||undefined,confidence,forceEvidence,history:nextHistory.slice(0,-1).map((turn:any)=>({role:turn.role,content:turn.role==="assistant"?[turn.content,...(turn.blocks??[]).map(tutorBlockText)].filter(Boolean).join("\n"):turn.content}))})});const body:any=await response.json();if(!response.ok)throw new Error(body.error||"AI Tutor 暂时不可用");const id=crypto.randomUUID();setMessages((current)=>[...current,{id,role:"assistant",content:body.answer_summary,blocks:[],citations:body.citations??[],evidence:body.evidence}]);(body.blocks??[]).forEach((block:TutorBlock,index:number)=>setTimeout(()=>setMessages((current)=>current.map((message)=>message.id===id?{...message,blocks:[...(message.blocks??[]),block]}:message)),index*55))}catch(error:any){setMessages((current)=>[...current,{role:"assistant",content:error.message||"AI Tutor 暂时不可用；题目、章节与笔记均未改变。",error:true}])}finally{setLoading(false);setStatus("")}};
  const saveAnswer=async(noteType:"question"|"chapter")=>{const latest=[...messages].reverse().find((message)=>message.role==="assistant"&&!message.error);if(!latest)return;const scopeKey=noteType==="question"?`question:${question.id}`:`chapter:${chapterId}:all`,existing=notes.find((note)=>note.scope_key===scopeKey),answer=[latest.content,...(latest.blocks??[]).map(tutorBlockText)].filter(Boolean).join("\n\n"),body=[existing?.body?.trim(),`## AI Tutor · ${new Date().toLocaleString()}`,answer].filter(Boolean).join("\n\n");setStatus("正在保存到笔记…");try{const response=await fetch("/api/notes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({noteType,questionId:noteType==="question"?question.id:null,chapterId:noteType==="chapter"?chapterId:null,body})});const payload:any=await response.json();if(!response.ok)throw new Error(payload.error);onNoteChange(payload.note,scopeKey);setStatus(noteType==="chapter"?"已保存到 Chapter Note。":"已保存到 Question Note。")}catch{setStatus("笔记未保存；AI 对话仍保留在当前页面。")} };
  return <><button className="ai-tutor-launch" onClick={()=>{setOpen(true);setMinimized(false)}} aria-label="打开 AI Tutor"><MessageCircle/><span>问 AI</span></button>{open&&<aside className={cn("ai-tutor",minimized&&"minimized")} aria-label="AI Tutor"><header><div><MessageCircle/><div><b>AI Tutor</b><small>{chapterId?"当前题目 · 当前章节上下文":"当前题目上下文"}</small><span className="auto-evidence">自动联网：开启</span></div></div><div><button onClick={()=>setMinimized((value)=>!value)} aria-label="最小化"><Minus/></button><button onClick={()=>setOpen(false)} aria-label="关闭">×</button></div></header>{!minimized&&<><div className="ai-tutor-tools"><button disabled={loading} onClick={()=>void ask("请重新联网核验当前问题的澳洲指南。",true)}><RefreshCw/>强制重新联网核验</button></div><div className="ai-tutor-thread">{!messages.length&&<p className="muted">问概念、推理或本节总结；涉及时效性医学建议时自动调用澳洲证据检索与 Evidence Gate。</p>}{messages.map((message,index)=><article key={message.id??index} className={cn("ai-message",message.role,message.error&&"error")}>{message.evidence&&<div className={`tutor-evidence ${message.evidence.mode}`}><b>{message.evidence.label}</b>{message.evidence.sourceCount>0&&<span>{message.evidence.sourceCount} authoritative source{message.evidence.sourceCount>1?"s":""}{message.evidence.verifiedAt?` · ${new Date(message.evidence.verifiedAt).toLocaleDateString()}`:""}</span>}</div>}<p className="tutor-summary">{message.content}</p>{message.blocks?.length?<TutorBlocks blocks={message.blocks}/>:null}{message.citations?.length?<div className="ai-citations"><b>Sources</b>{message.citations.map((source:any,i:number)=><a key={`${source.url}-${i}`} href={source.url} target="_blank" rel="noreferrer"><b>{source.issuingBody??"Australian authority"}</b><span>{source.title}{source.documentDate?` · ${source.documentDate}`:""} · retrieved {source.retrievalDate??"recorded"}</span><ExternalLink/></a>)}</div>:null}{message.role==="assistant"&&!message.error&&<div className="ai-save"><button onClick={()=>saveAnswer("question")}>保存到 Question Note</button>{chapterId&&<button onClick={()=>saveAnswer("chapter")}>保存到 Chapter Note</button>}</div>}</article>)}{loading&&<div className="ai-thinking"><LoaderCircle/> {status||"AI 正在回答…"}</div>}</div>{status&&!loading&&<p className="ai-status">{status}</p>}<form onSubmit={(event)=>{event.preventDefault();void ask()}}><textarea value={input} onChange={(event)=>setInput(event.target.value)} placeholder="例如：为什么这里不是 digoxin？" rows={3}/><Button type="submit" size="sm" disabled={!input.trim()||loading}><Send/>发送</Button></form></>}</aside>}</>}
/**
 * Floating dictionary window.
 *
 * Deliberately NOT a dialog and NOT a layout column:
 *  - it is portalled to <body> and position:fixed, so it can never reflow, narrow or
 *    cover the question card;
 *  - dragging it by the title bar moves it out of the way, and the position survives
 *    a reload; the phone layout ignores the saved position and stays a bottom bar;
 *  - clicking a word paints the title on the same tick and a local hit paints the
 *    gloss without any network call.
 */
const WORD_PANEL_POS_KEY="amc.word.panel.pos.v1";
function WordPanel({state,pinned,collapsed,saved,saving,onClose,onTogglePin,onToggleCollapse,onAdd,onRemove,onRetry}:{state:WordPanelState|null;pinned:boolean;collapsed:boolean;saved:boolean;saving:boolean;onClose:()=>void;onTogglePin:()=>void;onToggleCollapse:()=>void;onAdd:()=>void;onRemove:()=>void;onRetry:()=>void}){
  const word=state?.word;
  const [mounted,setMounted]=useState(false);
  const [pos,setPos]=useState<{x:number;y:number}|null>(null);
  const posRef=useRef<{x:number;y:number}|null>(null);
  const drag=useRef<{dx:number;dy:number;w:number;h:number}|null>(null);
  useEffect(()=>{posRef.current=pos},[pos]);
  useEffect(()=>{
    setMounted(true);
    try{const raw=window.localStorage.getItem(WORD_PANEL_POS_KEY);if(raw){const parsed=JSON.parse(raw);if(typeof parsed?.x==="number"&&typeof parsed?.y==="number")setPos({x:parsed.x,y:parsed.y})}}catch{}
  },[]);
  function startDrag(event:React.PointerEvent){
    if(window.matchMedia("(max-width:900px)").matches)return;
    const panel=(event.currentTarget as HTMLElement).closest(".word-panel") as HTMLElement|null;
    if(!panel)return;
    const rect=panel.getBoundingClientRect();
    drag.current={dx:event.clientX-rect.left,dy:event.clientY-rect.top,w:rect.width,h:rect.height};
    // A synthetic or already-released pointer id makes setPointerCapture throw; that
    // must not abort the React event handler (it surfaced as a dev error overlay).
    try { panel.setPointerCapture?.(event.pointerId); } catch { /* pointer not capturable */ }
  }
  function moveDrag(event:React.PointerEvent){
    if(!drag.current)return;
    const width=Math.min(380,window.innerWidth-16);
    const x=Math.min(Math.max(8,event.clientX-drag.current.dx),Math.max(8,window.innerWidth-width-8));
    const y=Math.min(Math.max(8,event.clientY-drag.current.dy),Math.max(8,window.innerHeight-72));
    setPos({x,y});
  }
  function endDrag(){
    if(!drag.current)return;
    drag.current=null;
    try{if(pos)window.localStorage.setItem(WORD_PANEL_POS_KEY,JSON.stringify(pos))}catch{}
  }
  if(!mounted)return null;
  return createPortal(<aside
    className={cn("word-panel",!!pos&&"moved",collapsed&&"collapsed",!state&&"idle")}
    style={pos?{left:pos.x,top:pos.y,right:"auto",bottom:"auto"}:undefined}
    aria-label="词典 / dictionary" data-testid="word-panel" data-status={state?.status??"idle"}>
    <header className="wp-head">
      <div className="wp-title" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} title="拖动可移动词典窗">
        <span className="wp-kicker">{state?.status==="loading"?"词典 · 查询中":"词典 · 中文释义"}</span>
        <b title={state?.surface}>{state?.surface??(pinned?"点击文中单词":"词典")}</b>
        {word&&word.lemma!==(state?.surface??"").toLowerCase()&&<small>{word.lemma}</small>}
        {word&&<span className="wp-inline">{word.translationZh}</span>}
      </div>
      <div className="wp-tools">
        <button type="button" className={cn(pinned&&"active")} aria-pressed={pinned} onClick={onTogglePin} title={pinned?"取消固定":"固定词典窗"}><Pin size={14}/><span className="visually-hidden">固定词典窗</span></button>
        <button type="button" onClick={onToggleCollapse} title={collapsed?"展开词典":"折叠词典"}>{collapsed?<ChevronUp size={15}/>:<ChevronDown size={15}/>}<span className="visually-hidden">{collapsed?"展开词典":"折叠词典"}</span></button>
        <button type="button" onClick={onClose} title="关闭词典"><X size={15}/><span className="visually-hidden">关闭词典</span></button>
      </div>
    </header>
    {!collapsed&&<div className="wp-body">
      {!state&&<p className="wp-status">点击题干、选项或解析中的任意英文单词，这里会立即显示中文释义；查词不会打断作答。</p>}
      {state?.status==="loading"&&<p className="wp-status" role="status"><LoaderCircle size={14} className="wp-spin"/>本地词典未收录，正在后台查询…你可以继续作答、提交或翻页。</p>}
      {state?.status==="error"&&<div className="wp-error" role="alert"><p>{state.error}</p>{state.retryable&&<Button size="sm" variant="outline" onClick={onRetry}><RefreshCw size={13}/>重试</Button>}</div>}
      {word&&<>
        <p className="wp-gloss">{word.translationZh}</p>
        <dl className="wp-dl">
          <dt>本题语境</dt><dd>{word.contextualMeaningZh}</dd>
          <dt>词性</dt><dd>{word.partOfSpeech}</dd>
          <dt>实体 / 类型</dt><dd>{word.entityType}</dd>
          <dt>构词</dt><dd>{word.morphologyZh}</dd>
          <dt>词源</dt><dd>{word.etymologyZh}</dd>
          <dt>记忆</dt><dd>{word.mnemonicZh}</dd>
        </dl>
      </>}
    </div>}
    <footer className="wp-foot">
      <span className="wp-layer">{wordLayerLabel(state?.layer)}{state?.latencyMs!=null?` · ${Math.round(state.latencyMs)} ms`:""}</span>
      {word&&(saved?<span className="wp-saved"><CheckCircle2 size={13}/>已加入词汇本<button type="button" onClick={onRemove} disabled={saving}>移出</button></span>:<Button size="sm" onClick={onAdd} disabled={saving}>{saving?"保存中…":"加入词汇本"}</Button>)}
    </footer>
  </aside>,document.body);
}

function Assist({text,zh,id,showZh,setShowZh,onWord}:{text:string;zh?:string;id:string;showZh:Record<string,boolean>;setShowZh:any;onWord:(w:string)=>void}){const parts=text.split(/(\b[a-zA-Z][a-zA-Z'-]*\b)/g);return <span className="assist"><span>{parts.map((p,i)=>/^[a-zA-Z][a-zA-Z'-]*$/.test(p)?<button className="word" onClick={(e)=>{e.stopPropagation();onWord(p)}} key={i}>{p}</button>:p)}</span>{zh&&<><button className="translate" onClick={(e)=>{e.stopPropagation();setShowZh((s:any)=>({...s,[id]:!s[id]}));}}>{showZh[id]?"隐藏中文":"显示中文"}</button>{showZh[id]&&<span className="zh">{zh}</span>}</>}</span>}
function VisualAsset({url,questionId,translateAllEpoch}:{url:string;questionId:string;translateAllEpoch:number}){const [failed,setFailed]=useState(false);const caption="Source-page visual · retained from the v2.9.4 asset manifest";return <figure className="visual-asset">{!failed?<img src={url} alt={`Source image for question ${questionId}`} onError={()=>setFailed(true)}/>:<div className="visual-fallback"><TriangleAlert/><b>图片预览暂不可用</b><span>资源指针已保留，可从资料来源重新打开。</span></div>}<figcaption>{caption}<MiniTranslation kind="question" blocks={[{type:"paragraph",text:caption}]} translateAllEpoch={translateAllEpoch}/></figcaption></figure>}
function WordText({text,onWord}:{text:string;onWord:(word:string)=>void}){const parts=text.split(/(\b[a-zA-Z][a-zA-Z'-]*\b)/g);return <>{parts.map((part,i)=>/^[a-zA-Z][a-zA-Z'-]*$/.test(part)?<button className="word" onClick={(event)=>{event.stopPropagation();onWord(part)}} key={i}>{part}</button>:part)}</>}
function RichBlocks({blocks,onWord}:{blocks:ExplanationBlock[];onWord:(word:string)=>void}){return <div className="rich-explanation">{blocks.map((block,index)=>{const key=`${block.type}-${index}`;if(block.type==="heading")return <h3 key={key}>{block.text}</h3>;if(block.type==="bullet-list")return <ul key={key}>{block.items?.map((item,i)=><li key={i}><WordText text={item} onWord={onWord}/></li>)}</ul>;if(block.type==="ordered-list"||block.type==="clinical-pathway")return <ol className={block.type==="clinical-pathway"?"clinical-pathway":""} key={key}>{block.items?.map((item,i)=><li key={i}><WordText text={item} onWord={onWord}/></li>)}</ol>;if(block.type==="table")return <div className="rich-table-wrap" key={key}><table className="rich-table"><tbody>{block.rows?.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}><WordText text={cell} onWord={onWord}/></td>)}</tr>)}</tbody></table></div>;return <p key={key}><WordText text={block.text??""} onWord={onWord}/></p>})}</div>}
function AsyncPanel({title,text}:{title:string;text:string}){return <section className="panel async-panel" aria-live="polite"><div className="panel-title"><LoaderCircle/>{title}</div><div className="async-skeleton"><span/><span/><span/></div><p>{text}</p></section>}
function AnswerComparison({question,options,result,guidance,dual,translateAllEpoch}:{question:any;options:any[];result:any;guidance:Guidance;dual:any;translateAllEpoch:number}){
  // The source-era answer is ALWAYS rendered.  A current answer can only add a
  // second line; it never replaces the historical one.
  const sourceKey=String(dual?.source_era_answer??question.answer_key??"—");
  const source=optionLabel(options,sourceKey);
  const state=dual?.state??"REVIEW_REQUIRED";
  const currentKey=typeof dual?.current_answer==="string"&&dual.current_answer?dual.current_answer:null;
  const current=currentKey?optionLabel(options,currentKey):null;
  const reason=dual?.reason_for_change??null;
  const verifiedAt=dual?.verified_at?String(dual.verified_at).slice(0,10):null;
  const sourceFamily=dual?.source_family??null;
  const evidenceCount=Array.isArray(dual?.sources)?dual.sources.length:0;
  const translationBlocks:ExplanationBlock[]=[{type:"heading",text:result.correct?"Source-era answer correct":"Review the source-era answer"},{type:"table",rows:[["Source-era answer",source],["Current status",state==="VERIFIED_SAME"?"VERIFIED — answer unchanged":state==="VERIFIED_UPDATED"?"UPDATED":"REVIEW REQUIRED"],["Current Australian answer",current??"Not asserted"]]},...(reason?[{type:"paragraph" as const,text:`Why this changed: ${reason}`}]:[])];
  return <section className={cn("panel","answer-comparison",state==="VERIFIED_UPDATED"&&"updated",state==="REVIEW_REQUIRED"&&"unverified")}>
    <div className="answer-title"><b>{result.correct?"Source-era answer correct":"Review the source-era answer"}</b><Badge variant={state==="VERIFIED_UPDATED"?"destructive":"outline"}>{state}</Badge></div>
    <div className="answer-primary"><small>SOURCE-ERA ANSWER</small><strong>{source}</strong></div>
    
    <MiniTranslation kind="answer" blocks={translationBlocks} translateAllEpoch={translateAllEpoch}/>
  </section>
}
// The textbook layer is deliberately separate from both the source-era answer and
// the current Australian guidance: the learner needs to know what the bank said,
// what current guidance says, and WHERE to revise — three different things.
//
// It is also independent of the station's Canonical Knowledge Graph: an unmapped
// canonical chapter never blocks the Murtagh location or the reading.
//
// One in-flight promise per question is cached at module scope, because the locator
// card and the full-section area below BOTH need the same lookup and must not
// double-fetch it.
const murtaghCache=new Map<string,Promise<{locate:any;section:any}>>();
function loadMurtagh(questionId:string){
  const existing=murtaghCache.get(questionId);
  if(existing)return existing;
  const pending=(async()=>{
    const locate:any=await fetch(`/api/textbook/locate?questionId=${encodeURIComponent(questionId)}`,{cache:"no-store"}).then((r)=>r.json()).catch(()=>null);
    const locateStatus=String(locate?.status??"UNRESOLVED");
  const located=Boolean(locate?.section)&&(locateStatus==="VERIFIED_LOCATION"||locateStatus==="POSSIBLE_LOCATION");
    const uid=locate?.section_uid??locate?.section?.section_id??null;
    if(!located||!uid)return {locate,section:null};
    const section:any=await fetch(`/api/textbook/section?id=${encodeURIComponent(uid)}`,{cache:"no-store"}).then((r)=>r.json()).catch(()=>null);
    return {locate,section:section?.error?null:section};
  })();
  murtaghCache.set(questionId,pending);
  // A failed lookup must not poison the cache for the rest of the session.
  pending.catch(()=>murtaghCache.delete(questionId));
  return pending;
}
function useMurtagh(questionId:string){
  const [state,setState]=useState<{loading:boolean;locate:any;section:any;error?:string}>({loading:Boolean(questionId),locate:null,section:null});
  useEffect(()=>{
    if(!questionId){setState({loading:false,locate:null,section:null});return}
    let cancelled=false;
    setState({loading:true,locate:null,section:null});
    loadMurtagh(questionId)
      .then((data)=>{if(!cancelled)setState({loading:false,...data})})
      .catch(()=>{if(!cancelled)setState({loading:false,locate:null,section:null,error:"教材定位暂时不可用。"})});
    return ()=>{cancelled=true};
  },[questionId]);
  return state;
}
function scrollToMurtagh(){const target=document.getElementById("murtagh-full");if(target)target.scrollIntoView({behavior:"auto",block:"start"})}

/** Locator + jump affordances. The full text lives below the two columns. */
function TextbookLocationPanel({questionId}:{questionId:string}){
  const state=useMurtagh(questionId);
  if(state.loading)return <section className="panel"><small>Murtagh 9e</small><p className="muted">正在定位教材章节…</p></section>;
  const locate:any=state.locate;
  // The status string used to be scoped to loadMurtagh(), so this component threw a
  // ReferenceError as soon as a location existed. Keep it local and derived.
  const locateStatus=String(locate?.status??"UNRESOLVED");
  const located=Boolean(locate)&&(locate.status==="mapped"||locate.status==="related")&&locate.section;
  if(!located){
    return <section className="panel"><small>Murtagh 9e</small><b>暂未可靠定位到 Murtagh 对应章节</b>
      <p className="muted">语义重排没有给出高置信的候选，因此不给章节——宁可少显示，也不把不确定的章节当作权威。</p>
      <a className="tb-jump-link" href="/textbook">前往教科书搜索</a></section>;
  }
  const s=locate.section;
  const pages=pageRangeLabel(s.page_start,s.page_end);
  const uid=locate.section_uid??s.section_id;
  return <section className="panel murtagh-locator"><small>Murtagh 9e{locate.method==="reviewed"?" · 已审核映射":""}{locateStatus==="POSSIBLE_LOCATION"?" · 可能相关":""}</small>
    <b>{[s.chapter_title,s.section_title].filter(Boolean).join(" › ")}</b>
    <span className="dual-meta">{pages}{typeof locate.confidence==="number"?` · 置信度 ${Math.round(locate.confidence*100)}%`:""}</span>
    <div className="murtagh-actions">
      <button type="button" onClick={scrollToMurtagh}>跳到教材</button>
      <a href={`/textbook/section/${encodeURIComponent(uid)}`} target="_blank" rel="noreferrer">在教科书中打开<ExternalLink/></a>
    </div>
  </section>;
}

/**
 * The whole Murtagh section, at the very bottom of the question page, on the
 * page's own width — from the first block to the last.  Never a snippet: the block
 * count returned is checked against the section's own count and a mismatch is
 * reported instead of silently passing for a complete section.
 */
function MurtaghFullSection({questionId}:{questionId:string}){
  const state=useMurtagh(questionId);
  const locate=state.locate;
  const section=state.section;
  const located=Boolean(locate)&&(locate.status==="mapped"||locate.status==="related")&&locate.section;
  if(state.loading)return <section className="textbook-full" id="murtagh-full"><div className="textbook-full-head"><div><small className="kicker">Murtagh 9e · 教材原文</small><h2>正在载入教材全文…</h2></div></div></section>;
  const verified=String(locate?.status??"")==="VERIFIED_LOCATION";
  if(!located||!section||!verified){
    return <section className="textbook-full" id="murtagh-full"><div className="textbook-full-head"><div><small className="kicker">Murtagh 9e · 教材原文</small><h2>{located?"该候选只是可能相关，未作为权威章节展示":"暂未可靠定位到 Murtagh 对应章节"}</h2><p>只有语义重排给出高置信候选时才在这里显示完整章节原文；宁可少显示，也不展示不确定的章节。</p></div><div className="textbook-full-actions"><a href="/textbook">打开教科书</a></div></div></section>;
  }
  const s=section.section;
  const returned=section.counts?.returned_blocks??section.blocks?.length??0;
  const source=section.counts?.source_blocks??s.block_count??0;
  return <section className="textbook-full" id="murtagh-full">
    <div className="textbook-full-head">
      <div>
        <small className="kicker">Murtagh 9e · 教材原文</small>
        <h2>{s.section_title||"（无标题小节）"}</h2>
        <p>{[section.part?.part_title&&`Part ${section.part.part_order} · ${section.part.part_title}`,section.chapter?`${section.chapter.chapter_number?`Chapter ${section.chapter.chapter_number} · `:""}${section.chapter.chapter_title}`:null].filter(Boolean).join(" › ")}</p>
        <p>{pageRangeLabel(s.start_page,s.end_page)}{s.printed_page_start?` · 原书页码 p.${s.printed_page_start}`:""}{` · 本节完整 ${source} 个块`}</p>
      </div>
      <div className="textbook-full-actions">
        <button type="button" onClick={()=>{const target=document.getElementById("murtagh-full");if(target)target.scrollIntoView({behavior:"auto",block:"start"})}}>回到题目上方</button>
        <a href={`/textbook/section/${encodeURIComponent(s.section_uid)}`} target="_blank" rel="noreferrer">在教科书中打开<ExternalLink/></a>
      </div>
    </div>
    <div className="textbook-full-doc"><TextbookBlocks blocks={section.blocks??[]}/></div>
    {returned!==source?<p className="tb-error">正文不完整：本节共 {source} 个块，仅返回 {returned} 个。</p>:null}
  </section>;
}

function liveStatusLabel(live:any){
  const status=String(live?.status??"UNKNOWN");
  if(status==="CHECKING")return"正在联网核验…";
  if(status==="VERIFIED_SAME")return"已核对：与旧答案一致";
  if(status==="REVIEW_REQUIRED")return"已抓取来源，仍需人工复核";
  if(status==="SOURCE_ONLY")return"仅取到来源";
  if(status==="VERIFICATION_UNAVAILABLE")return"本次未能完成核验";
  return status;
}
function internationalVerdictOf(live:any){
  const text=String(live?.reason??"");
  if(!text.startsWith("INTERNATIONAL_ONLY:"))return null;
  const verdict=text.split(":")[1];
  return verdict==="supports"||verdict==="contradicts"?""+verdict:null;
}
function liveReasonText(reason:any){
  const text=String(reason??"");
  if(!text)return"尚未执行联网核验。提交答案后会自动核验一次。";
  if(text.startsWith("INTERNATIONAL_ONLY:")){
    const parts=text.split(":");
    const verdict=parts[1];
    const confidence=parts[2]==="high"?"高":parts[2]==="medium"?"中":"低";
    const note=parts.slice(3).join(":").trim();
    const label=verdict==="contradicts"?"不一致：国际权威来源与原答案不符":"一致：国际权威来源支持原答案";
    return `${label}（置信度${confidence} · 非澳洲官方指南）。${note}`.trim();
  }
  if(text.startsWith("NO_FETCHED_EVIDENCE"))return"本次联网未取到可用的澳洲权威原文（站点超时或无候选），因此不改变原题答案。可稍后重试。";
  if(text==="LIVE_CHECK_TIMEOUT")return"联网核验超时，已保留原答案。可重试。";
  if(text.startsWith("LIVE_RETRIEVAL_FAILED"))return"抓取澳洲权威站点失败（网络受限）。原答案不受影响，可重试。";
  if(text.startsWith("LIVE_ADJUDICATION_FAILED"))return"已抓取原文，但证据判定失败。原答案不受影响。";
  if(text.startsWith("LIVE_GATE"))return"已抓取原文，但未通过证据门控（不足以改变选项级答案）。";
  if(text.startsWith("cached verification"))return"使用 7 天内缓存的核验结果。";
  return text.slice(0,160);
}
function CurrentEvidence({guidance,dual,questionId,live,onRetry,translateAllEpoch}:{guidance:Guidance;dual:any;questionId:string;live?:any;onRetry?:()=>void;translateAllEpoch:number}){
  // Read-only provenance view.  It never triggers a search and never turns an
  // unverified machine candidate into a current answer.
  const state=dual?.state??"REVIEW_REQUIRED";
  const sources=Array.isArray(dual?.sources)?dual.sources:[];
  const version=dual??null;
  const evidenceBlocks:ExplanationBlock[]=[{type:"heading",text:"Current Australian guidance · evidence"},{type:"paragraph",text:state==="REVIEW_REQUIRED"?"No sufficiently reliable option-level update has been verified for this question. The source-era answer above remains the record of the original bank.":"The current answer below is backed by the listed Australian authoritative sources."},{type:"table",rows:[["State",state],["Verification mode",version?.verification_mode??"not applicable"],["Verified",version?.verified_at?String(version.verified_at).slice(0,10):"not verified"],["Version",version?.version_no?`v${version.version_no}`:"—"]]},...(sources.length?[{type:"bullet-list" as const,items:sources.map((source:any)=>`${source?.sourceFamily??"Australian authority"}: ${source?.title??"Australian clinical guidance"}`)}]:[])];
  return <section className="panel current-evidence" id={`current-evidence-${questionId}`}>
    <div className="panel-title">{state==="REVIEW_REQUIRED"?<TriangleAlert/>:<CheckCircle2/>} Current Australian guidance</div>
    {state==="REVIEW_REQUIRED"
      ? <><b>REVIEW REQUIRED</b><p>No sufficiently reliable option-level update has been verified.</p>
          <p className="guidance-consistency"><b>{internationalVerdictOf(live)==="supports"?(live?.sources?.length?"一致：国际来源支持原答案（非澳洲官方）":"一致：按题库答案（本次无联网来源，置信度低）"):internationalVerdictOf(live)==="contradicts"?"不一致：国际来源与原答案不符（非澳洲官方）":"与原答案是否一致：未能确认"}</b><span>{internationalVerdictOf(live)?"结论来自本次联网抓取的国际权威来源，澳洲官网原文未能取到；原答案保持不变。":"本次联网没有取到可核验的澳洲原文，因此不改变原答案。"}</span></p>
          <div className="guidance-live">
            <div className="guidance-live-head"><b>本次联网核验</b><span>{liveStatusLabel(live)}</span></div>
            <p>{liveReasonText(live?.reason)}</p>
            {onRetry&&<Button size="sm" variant="outline" onClick={onRetry} disabled={live?.status==="CHECKING"}><RefreshCw size={13}/>{live?.status==="CHECKING"?"核验中…":"重新联网核验"}</Button>}
          </div>
        </>
      : <><p className="guidance-consistency"><b>{state==="VERIFIED_SAME"?"与原答案一致":`现行答案已更新：${version?.current_answer??"—"}`}</b>{version?.current_answer_text&&state!=="VERIFIED_SAME"&&<span>{version.current_answer_text}</span>}</p><dl>
          <dt>State</dt><dd>{state}</dd>
          <dt>Verification mode</dt><dd>{version?.verification_mode??"—"}</dd>
          <dt>Effective date</dt><dd>{version?.effective_date??"—"}</dd>
          <dt>Verified</dt><dd>{version?.verified_at?String(version.verified_at).slice(0,10):"—"}</dd>
          <dt>Version</dt><dd>{version?.version_no?`v${version.version_no}`:"—"}</dd>
        </dl></>}
    {sources.length>0&&<div className="sources">{sources.map((source:any,index:number)=>source?.url?<a key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noreferrer"><b>{source.sourceFamily??"Australian authority"}</b><span>{source.title??"Australian clinical guidance"}{source.documentDate?` · ${source.documentDate}`:""} ↗</span></a>:<div key={`${index}`}><b>{source?.sourceFamily??"Australian authority"}</b><span>{source?.title??"Australian clinical guidance"}</span></div>)}</div>}
    <MiniTranslation kind="current-evidence" blocks={evidenceBlocks} translateAllEpoch={translateAllEpoch}/>
  </section>
}
function coachBlocksFromAmcCoach(coach:AmcCoach):ExplanationBlock[]{
  // Only the sections the evidence budget allowed are rendered; nothing is padded.
  const blocks:ExplanationBlock[]=[];
  if(coach.cues.length){blocks.push({type:"heading",text:"一眼识别"});blocks.push({type:"bullet-list",items:coach.cues.map((item)=>`${item.cue} → ${item.think}`)})}
  if(coach.cueDecisions.length){blocks.push({type:"heading",text:"看到这个词，想到什么"});blocks.push({type:"bullet-list",items:coach.cueDecisions.map((item)=>`${item.cue} → ${item.decision}`)})}
  if(coach.differentiators.length){blocks.push({type:"heading",text:"最容易混淆的鉴别"});for(const item of coach.differentiators){blocks.push({type:"paragraph",text:`${item.pair}：真正拉开差距的是 ${item.discriminator}`});blocks.push({type:"bullet-list",items:[`支持本诊断：${item.supporting}`,`反对相似诊断：${item.opposing}`]})}}
  if(coach.trap){blocks.push({type:"heading",text:"AMC 陷阱"});blocks.push({type:"paragraph",text:coach.trap.option?`最诱人的错误选项 ${coach.trap.option}：${coach.trap.why}`:coach.trap.why})}
  if(coach.takeaway){blocks.push({type:"heading",text:"一句话拿分"});blocks.push({type:"paragraph",text:coach.takeaway})}
  return blocks;
}
function coachEvidenceNote(evidence:any):string{
  if(!evidence)return "";
  if(evidence.level==="RICH")return "";
  const parts=[];
  if(evidence.level==="THIN")parts.push(`原书解析仅 ${evidence.sourceChars} 字符，因此只输出能直接支撑的条目`);
  else parts.push("本题没有原书解析，只输出题干本身能支撑的识别线索");
  if(Array.isArray(evidence.withheld)&&evidence.withheld.length)parts.push("未开放："+evidence.withheld.map((key:string)=>({diagnosis:"本题考点",cueDecisions:"看到这个词想到什么",differentiators:"最容易混淆的鉴别",trap:"AMC 陷阱"}[key]??key)).join("、"));
  return parts.join("；")+"。";
}
function Coach({coach,evidence,state,onRetry,onWord}:{coach:AmcCoach|null;evidence?:any;state:{status:string;error?:string};onRetry:()=>void;onWord:(word:string)=>void}){
  const note=coachEvidenceNote(evidence);
  if(state.status==="loading")return <AsyncPanel title="AI Coach" text="正在生成考场识别线索与鉴别点…"/>;
  if(state.status==="error")return <section className="panel coach coach-empty"><div className="panel-title"><BrainCircuit/> AI Coach · 踩分点教练</div><p className="coach-note">{state.error??"AI Coach 生成失败，请点击重新生成。"}</p><Button variant="outline" size="sm" onClick={onRetry}>重新生成</Button></section>;
  if(!coach)return <section className="panel coach coach-empty"><div className="panel-title"><BrainCircuit/> AI Coach · 踩分点教练</div><p className="coach-note">提交答案后生成「一眼识别 / 鉴别 / 陷阱 / 一句话拿分」，直接输出中文，不重复原解析；依据不足时宁可少写，不凑栏目。</p><Button variant="outline" size="sm" onClick={onRetry}>立即生成</Button></section>;
  return <section className="panel coach"><div className="coach-head"><Badge variant="outline">AMC 踩分点教练</Badge><span className="coach-scope">中文直出 · 不是翻译 · 不复述原解析</span><Button variant="outline" size="sm" onClick={onRetry}><RefreshCw/>重新生成</Button></div>{coach.diagnosis&&<p className="coach-diagnosis"><b>本题考点</b>{coach.diagnosis}</p>}{note&&<p className="coach-evidence-note" role="status"><TriangleAlert size={13}/>{note}</p>}<div className="coach-structure"><RichBlocks blocks={coachBlocksFromAmcCoach(coach)} onWord={onWord}/></div><p className="coach-note">Coach 只讲考场识别与鉴别；现行澳洲指南结论只出现在 Current Evidence 层。</p></section>
}
async function requestUnifiedTranslation(kind:string,blocks:ExplanationBlock[]){const response=await fetch("/api/translation",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind,sourceLanguage:"en",targetLanguage:"zh-CN",blocks})});const body:any=await response.json();if(!response.ok)throw new Error(body.error||"统一翻译暂不可用");return body}
async function requestChunkedTranslation(kind:string,batches:ExplanationBlock[][]){const translated:ExplanationBlock[]=[];let allCached=true,provider="";for(let index=0;index<batches.length;index++){try{const body=await requestUnifiedTranslation(kind,batches[index]);translated.push(...body.blocks);allCached=allCached&&body.cache==="hit";provider=provider||body.provider}catch(error:any){throw new Error(`第 ${index+1} 节翻译失败：${error.message||"统一翻译暂不可用"}`)}}return {blocks:translated,cache:allCached?"hit":"miss",provider}}
function chapterTranslationBatches(blocks:ExplanationBlock[]){const batches:ExplanationBlock[][]=[];let current:ExplanationBlock[]=[];for(const block of blocks){if(block.type==="heading"&&current.length){batches.push(current);current=[]}current.push(block)}if(current.length)batches.push(current);return batches}
function QuestionTranslation({question,options,translateAllEpoch}:{question:any;options:any[];translateAllEpoch:number}){const [state,setState]=useState<TranslationState>({visible:false});const lastEpoch=useRef(0);const begin=useLatestRequest();const blocks:ExplanationBlock[]=[{type:"paragraph",text:question.stem_en},{type:"table",rows:options.map((option:any)=>[option.option_key,String(option.text_en).replace(/^O?[A-E][.)]?\s*/i,"")])}];const show=async(force=false)=>{if(state.blocks){setState((current)=>({...current,visible:force||!current.visible}));return}setState({visible:false,loading:true});const still=begin();try{const body=await requestUnifiedTranslation("question",blocks);if(!still())return;setState({visible:true,blocks:body.blocks,cache:body.cache,provider:body.provider})}catch(error:any){if(!still())return;setState({visible:false,error:error.message})}};useEffect(()=>{if(translateAllEpoch>lastEpoch.current){lastEpoch.current=translateAllEpoch;void show(true)}},[translateAllEpoch]);return <div className="question-translation"><Button variant="outline" size="sm" onClick={()=>show(false)} disabled={state.loading}><Languages/>{state.loading?"翻译中…":state.visible?"隐藏翻译":"翻译题干与选项"}</Button>{state.error&&<span className="translation-error">{state.error}</span>}{state.visible&&state.blocks&&<div className="full-zh"><b>题干与选项 · 中文 <small>{state.cache==="hit"?"CACHE HIT":"NEW TRANSLATION"}</small></b><RichBlocks blocks={state.blocks} onWord={()=>{}}/></div>}</div>}
function MiniTranslation({kind,blocks,batches,translateAllEpoch}:{kind:string;blocks:ExplanationBlock[];batches?:ExplanationBlock[][];translateAllEpoch:number}){const [state,setState]=useState<TranslationState>({visible:false});const lastEpoch=useRef(0);const begin=useLatestRequest();const show=async(force=false)=>{if(state.blocks){setState((current)=>({...current,visible:force||!current.visible}));return}setState({visible:false,loading:true});const still=begin();try{const chunks=batches?.length?batches:kind==="chapter"?chapterTranslationBatches(blocks):null;const body=chunks?await requestChunkedTranslation(kind,chunks):await requestUnifiedTranslation(kind,blocks);if(!still())return;setState({visible:true,blocks:body.blocks,cache:body.cache,provider:body.provider})}catch(error:any){if(!still())return;setState({visible:false,error:error.message})}};useEffect(()=>{if(translateAllEpoch>lastEpoch.current){lastEpoch.current=translateAllEpoch;void show(true)}},[translateAllEpoch]);return <div className="mini-translation"><Button variant="outline" size="sm" onClick={()=>show(false)} disabled={state.loading}>{state.loading?"翻译中…":state.visible?"隐藏翻译":"翻译本模块"}</Button>{state.error&&<p className="translation-error">{state.error}</p>}{state.visible&&state.blocks&&<div className="full-zh"><b>中文翻译 · {state.cache==="hit"?"CACHE HIT":"NEW TRANSLATION"}</b><RichBlocks blocks={state.blocks} onWord={()=>{}}/></div>}</div>}
function FullExplanation({title,buttonLabel="全文翻译",questionId,explanationType,blocks,state,setState,onWord,translateAllEpoch=0}:{title:string;buttonLabel?:string;questionId:string;explanationType:ExplanationType;blocks:ExplanationBlock[];state?:TranslationState;setState:any;onWord:(word:string)=>void;translateAllEpoch?:number}){const key=`${explanationType}:${questionId}`;const lastEpoch=useRef(0);const begin=useLatestRequest();const kind=explanationType==="chapter-review"?"chapter":explanationType;const translate=async(force=false)=>{if(state?.blocks){setState((all:any)=>({...all,[key]:{...state,visible:force||!state.visible,error:undefined}}));return}setState((all:any)=>({...all,[key]:{visible:false,loading:true,error:undefined}}));const still=begin();try{const body=await requestUnifiedTranslation(kind,blocks);if(!still())return;setState((all:any)=>({...all,[key]:{visible:true,blocks:body.blocks,loading:false,error:undefined,cache:body.cache,provider:body.provider}}))}catch(error:any){if(!still())return;setState((all:any)=>({...all,[key]:{visible:false,loading:false,error:error.message||"全文翻译暂不可用"}}))}};useEffect(()=>{if(translateAllEpoch>lastEpoch.current){lastEpoch.current=translateAllEpoch;void translate(true)}},[translateAllEpoch]);return <section className="full-explanation"><div className="explanation-head"><h2>{title}</h2><Button variant="outline" size="sm" onClick={()=>translate(false)} disabled={state?.loading}>{state?.loading?"翻译中…":state?.visible?"隐藏翻译":buttonLabel}</Button></div>{state?.error&&<p className="translation-error" role="alert">{state.error}</p>}<RichBlocks blocks={blocks} onWord={onWord}/>{state?.visible&&state.blocks&&<div className="full-zh"><b>{buttonLabel} · {state.cache==="hit"?"CACHE HIT":"NEW TRANSLATION"}</b><RichBlocks blocks={state.blocks} onWord={onWord}/></div>}</section>}
function Dashboard({stats,reviews,node,insights,onPractice,onRestart,resumeLabel}:{stats:any;reviews:any[];node:any;insights:any;onPractice:()=>void;onRestart:()=>void;resumeLabel:string}){const deadlines=[];const next=node?[`${node.canonical_name} · ${node.clinical_task}`,node.highConfidenceWrong?`${node.highConfidenceWrong} 次 Wrong + Confident`:`${node.correctGuess} 次 Correct + Guess`,node.reviewDue?"复习已到期":"按掌握度继续巩固"]:["完成首题以建立真实学习画像","未做知识点只显示 unassessed","先形成首个 Knowledge Node 证据"];return <section className="dashboard"><div className="hero-row"><div><p className="kicker">TODAY’S CONTROL PANEL</p><h1>把每一道题转成下一次更好的临床决策。</h1><p>核心指标：Knowledge Coverage、Mastery、Retention、Confidence Calibration。</p></div><div className="hero-actions"><Button size="lg" onClick={onPractice}><BookOpen/>开始刷题</Button><Button size="lg" variant="outline" onClick={onRestart}>{resumeLabel}</Button></div></div><div className="metrics"><Stat label="知识覆盖" value={`${insights.assessed.filter((n:any)=>n.attemptCount>0).length}/${insights.assessed.length}`} detail="assessed nodes"/><Stat label="Mastery" value={node?.mastery===null||node?.mastery===undefined?"—":`${node.mastery}%`} detail="最高优先节点"/><Stat label="Confidence calibration" value={`${stats.confAcc}%`} detail="确定作答正确率"/><Stat label="Retention" value={`${insights.due.length}`} detail="due reviews"/></div><p className="source-scope-stats" role="note">主统计口径：Emidici · 已完成 {stats.total} · 正确率 {stats.accuracy}% · 确定作答正确率 {stats.confAcc}%{stats.legacy.total?`　|　Legacy usable（次级统计，不计入主进度）：已完成 ${stats.legacy.total} · 正确率 ${stats.legacy.accuracy}%`:""}</p><div className="dashboard-grid"><section className="panel focus"><div className="panel-title"><Target/> Today · Next Best Session</div><ol className="checklist">{next.map((item,i)=><li key={item}><b>{i+1}</b>{item}</li>)}</ol><Button className="mt-4" onClick={onPractice}>开始这组学习 <ChevronRight/></Button></section><section className="panel"><div className="panel-title"><Radar/> Misconception Radar</div>{stats.total?<><p>仅显示已有题目映射证据；尚未映射的错误不会被归因到跨学科模式。</p><div className="calibration"><span>Wrong + Confident <b>{stats.highWrong}</b></span><span>Correct + Guess <b>{stats.guessCorrect}</b></span><span>待映射 <b>—</b></span></div></>:<p className="empty">完成多道独立题目后，系统才会识别跨学科错误模式。</p>}</section></div><section className="panel backbone"><div className="panel-title"><Target/> AMC pathway · Exam backbone</div><div className="backbone-priority"><b>1</b><span>AMC MCQ → 临床评估 → 注册材料 → supervised practice</span><b>2</b><span>按考试窗口推进，具体日期自行填写</span><b>3</b><span>单科短板可单独加练，不挤占主线</span></div><div className="deadlines">{deadlines.map(([date,label,note])=><div key={date} className={daysUntil(date)<0?"passed":""}><time>{date}<em>{daysUntil(date)>=0?`${daysUntil(date)} d`:"passed"}</em></time><b>{label}</b><span>{note}</span></div>)}</div></section></section>}
function knowledgeBlocks(node:any,question:any,options:any[],guidance:Guidance,related:any[],coach:any):ExplanationBlock[]{const source=String(question.source_explanation_en??"");const blocks:ExplanationBlock[]=[{type:"heading",text:"Core concept"},{type:"paragraph",text:guidance.isVerified?(node?.current_summary??guidance.recommendation):`Source-era concept: ${concise(source,420)}`},{type:"heading",text:"Recognition"},{type:"paragraph",text:concise(question.stem_en,360)},{type:"heading",text:"Differential diagnosis"},{type:"bullet-list",items:options.map((option:any)=>`${option.option_key}: ${String(option.text_en).replace(/^O?[A-E][.)]?\s*/i,"")}`)}];if(guidance.isVerified){blocks.push({type:"heading",text:"Current Australian investigation / management"},{type:"ordered-list",items:Array.isArray(coach?.decision)&&coach.decision.length?coach.decision:[guidance.recommendation??"Follow the verified pathway in Current Evidence."]})}const redFlags=source.split(/(?<=[.!?])\s+/).filter((sentence)=>/unstable|emergency|bleed|suicid|dyspn|shock|severe|urgent|contraindicat/i.test(sentence)).slice(0,4);if(redFlags.length)blocks.push({type:"heading",text:"Red flags / contraindications"},{type:"bullet-list",items:redFlags.map((item)=>concise(item,220))});const pitfalls=options.filter((option:any)=>option.option_key!==question.answer_key).map((option:any)=>distractorReason(source,option.option_key)).filter(Boolean).slice(0,4) as string[];if(pitfalls.length)blocks.push({type:"heading",text:"Pitfalls"},{type:"bullet-list",items:pitfalls});if(guidance.isUpdated)blocks.push({type:"heading",text:"Guideline update"},{type:"paragraph",text:guidance.whatChanged??guidance.recommendation??"Verified current practice differs from the source-era record."});blocks.push({type:"heading",text:"AMC high-yield"},{type:"bullet-list",items:[`Source-era keyed option: ${optionLabel(options,question.answer_key)}`,guidance.isVerified?`Current status: ${guidance.status}`:"Current Australian answer: UNVERIFIED",isUsefulMemoryRule(question.memory_rule_en)?String(question.memory_rule_en):`Use the stem's discriminator; do not memorise an unsupported modern rule.`]});if(related.length)blocks.push({type:"heading",text:"Related questions"},{type:"bullet-list",items:related.slice(0,5).map((item:any)=>concise(item.stem_en,160))});return blocks}
function chapterBlocks(node:any,questions:any[],attempts:any[],links:any[],reviews:any[],guidanceById:Map<string,Guidance>):ExplanationBlock[]{const ids=new Set(links.filter((link:any)=>link.node_id===node?.id).map((link:any)=>link.question_id));const chapterQuestions=questions.filter((question:any)=>ids.has(question.id));const chapterAttempts=attempts.filter((attempt:any)=>ids.has(attempt.question_id));const correct=chapterAttempts.filter((attempt:any)=>attempt.correct).length;const due=reviews.some((review:any)=>review.node_id===node?.id&&new Date(review.due_at).getTime()<=Date.now());const wrongIds=new Set(chapterAttempts.filter((attempt:any)=>!attempt.correct).map((attempt:any)=>attempt.question_id));const strongIds=new Set(chapterAttempts.filter((attempt:any)=>attempt.correct&&attempt.confidence==="confident").map((attempt:any)=>attempt.question_id));const updated=chapterQuestions.filter((question:any)=>guidanceById.get(question.id)?.isUpdated);return [{type:"heading",text:"Progress"},{type:"table",rows:[["Attempted",String(chapterAttempts.length)],["Correct",String(correct)],["Incorrect",String(chapterAttempts.length-correct)],["Accuracy",chapterAttempts.length?`${Math.round(correct/chapterAttempts.length*100)}%`:"Unassessed"],["Due for review",due?"Yes":"No"]]},{type:"heading",text:"Knowledge Nodes Covered"},{type:"bullet-list",items:[`${node?.canonical_name??"Current node"}: ${new Set(chapterAttempts.map((attempt:any)=>attempt.question_id)).size}/${chapterQuestions.length} questions sampled`]},{type:"heading",text:"Weak questions"},{type:"bullet-list",items:chapterQuestions.filter((question:any)=>wrongIds.has(question.id)).slice(0,6).map((question:any)=>concise(question.stem_en,150)).concat(wrongIds.size?[]:["No mistake evidence in this node yet."])},{type:"heading",text:"Strong questions"},{type:"bullet-list",items:chapterQuestions.filter((question:any)=>strongIds.has(question.id)).slice(0,6).map((question:any)=>concise(question.stem_en,150)).concat(strongIds.size?[]:["No confident-correct evidence in this node yet."])},{type:"heading",text:"Old question-bank facts you must NOT memorise"},{type:"bullet-list",items:updated.length?updated.map((question:any)=>`${concise(question.stem_en,110)} — ${guidanceById.get(question.id)?.status}`):["No verified guideline update is currently attached to this node."]}];}
function LearningPath({question,questions,options,nodes,links,attempts,reviews,insights,guidanceById,guidance,onPractice,translations,setTranslations,onWord}:any){const nodeId=links.find((l:any)=>l.question_id===question.id)?.node_id;const node=nodes.find((n:any)=>n.id===nodeId);const metric=insights.assessed.find((n:any)=>n.id===nodeId);const related=questions.filter((candidate:any)=>candidate.id!==question.id&&links.some((link:any)=>link.question_id===candidate.id&&link.node_id===nodeId));const [view,setView]=useState<"node"|"chapter"|null>(null);const blocks=view==="chapter"?chapterBlocks(node,questions,attempts,links,reviews,guidanceById):knowledgeBlocks(node,question,options.filter((option:any)=>option.question_id===question.id),guidance,related,null);const type:ExplanationType=view==="chapter"?"chapter-review":"knowledge-node";return <section className="learning-path panel"><p className="kicker">QUESTION → KNOWLEDGE NODE → CHAPTER REVIEW → TARGETED PRACTICE</p><h2>{node?.canonical_name??question.topic}</h2><div className="path-actions"><Button variant={view==="node"?"default":"outline"} onClick={()=>setView(view==="node"?null:"node")}>Knowledge Node</Button><Button variant={view==="chapter"?"default":"outline"} onClick={()=>setView(view==="chapter"?null:"chapter")}>Chapter Review</Button><Button onClick={()=>onPractice(nodeId)}>Start Targeted Practice</Button></div>{view&&<article className="study-sheet"><div className="sheet-head"><div><Badge>{view==="node"?"KNOWLEDGE NODE":"CHAPTER REVIEW"}</Badge><h2>{view==="node"?node?.canonical_name:node?.condition}</h2></div><Button variant="ghost" onClick={()=>setView(null)}>关闭</Button></div>{view==="chapter"&&<div className="why"><b>由真实学习数据驱动</b><span>{metric?.attemptCount??0} attempts · First-pass {metric?.firstPassAccuracy??"—"}% · Wrong + Confident {metric?.highConfidenceWrong??0} · Correct + Guess {metric?.correctGuess??0}</span></div>}<div className="knowledge-content"><FullExplanation title={view==="node"?"KNOWLEDGE NODE":"CHAPTER REVIEW"} questionId={question.id} explanationType={type} blocks={blocks} state={translations[`${type}:${question.id}`]} setState={setTranslations} onWord={onWord}/></div><div className="path-actions"><Button onClick={()=>onPractice(nodeId)}>Start this node’s targeted queue</Button></div></article>}</section>}
function chapterTranslationBlocks(sections:any[]):ExplanationBlock[]{const blocks:ExplanationBlock[]=[];for(const section of sections){if(!section||typeof section!=="object")continue;blocks.push({type:"heading",text:String(section.title??"")},{type:"paragraph",text:String(section.body??"")});for(const rawBlock of Array.isArray(section.blocks)?section.blocks:[]){const block=normalizeChapterBlock(rawBlock);if(!block)continue;if(block.type==="paragraph")blocks.push({type:"paragraph",text:block.text});else if(block.type==="callout")blocks.push({type:"heading",text:block.title},{type:"paragraph",text:block.text});else if(block.type==="bullets")blocks.push({type:"bullet-list",items:block.items});else if(block.type==="algorithm")blocks.push({type:"ordered-list",items:block.steps});else if(block.type==="table")blocks.push({type:"table",rows:[block.headers,...block.rows]})}}return blocks}
function ChapterRichBlock({block,onWord}:{block:any;onWord:(word:string)=>void}){if(block.type==="callout")return <aside className="chapter-callout"><b>{block.title}</b><p className="chapter-prose"><WordText text={block.text} onWord={onWord}/></p></aside>;if(block.type==="bullets")return <ul className="chapter-list">{block.items.map((item:string,index:number)=><li key={index}><span className="chapter-list-copy"><WordText text={item} onWord={onWord}/></span></li>)}</ul>;if(block.type==="algorithm")return <ol className="chapter-algorithm">{block.steps.map((step:string,index:number)=><li key={index}><span className="chapter-algorithm-step">{index+1}</span><span className="chapter-algorithm-copy"><WordText text={step} onWord={onWord}/></span></li>)}</ol>;if(block.type==="table")return <div className="chapter-table-wrap"><table className="chapter-table"><thead><tr>{block.headers.map((header:string,index:number)=><th key={`${header}-${index}`}>{header}</th>)}</tr></thead><tbody>{block.rows.map((row:string[],index:number)=><tr key={index}>{row.map((cell:string,cellIndex:number)=><td key={cellIndex}><WordText text={cell} onWord={onWord}/></td>)}</tr>)}</tbody></table></div>;return <p className="chapter-prose"><WordText text={block.text??""} onWord={onWord}/></p>}
function OpenKnowledgePath({question,questions,attempts,mappings,chapters,conceptReviews,onPractice,onWord,notes,onNoteChange,translateAllEpoch}:any){
  const mapping=mappings.find((row:any)=>row.question_id===question.id);
  if(!mapping)return <section className="learning-path panel"><p className="kicker">站内知识章节映射 · CANONICAL KNOWLEDGE LOCATION</p><h2>本题尚未映射到经过审核的 Canonical Chapter</h2><p className="muted">系统不会用当前题干临时拼出疾病章节。</p><p className="muted">这不影响 Murtagh 教材定位与阅读。</p></section>;
  const chapter=chapters.find((row:any)=>row.id===mapping.chapter_id);
  const sections=safeJson<any[]>(chapter?.sections_json,[]);
  const section=sections.find((row:any)=>row.id===mapping.section_id);
  const mappedQuestions=mappings.filter((row:any)=>row.chapter_id===mapping.chapter_id);
  const conceptQuestionIds=new Set(mappings.filter((row:any)=>row.tested_concept_id===mapping.tested_concept_id).map((row:any)=>row.question_id));
  const evidence=attempts.filter((row:any)=>row.tested_concept_id===mapping.tested_concept_id||conceptQuestionIds.has(row.question_id));
  const wrongConfident=evidence.filter((row:any)=>!row.correct&&row.confidence==="confident").length;
  const hiddenWeakness=evidence.filter((row:any)=>row.correct&&row.confidence==="guess").length;
  const card=conceptReviews.find((row:any)=>row.tested_concept_id===mapping.tested_concept_id);
  const translationBlocks=chapterTranslationBlocks(sections);
  return <section className="open-knowledge-flow">
    <article className="panel test-location"><p className="kicker">本题考点 · 站内知识章节映射</p><h2>{mapping.tested_concept_label}</h2><table><tbody><tr><th>question_id</th><td>{question.id}</td></tr><tr><th>chapter_id</th><td>{mapping.chapter_id}</td></tr><tr><th>section_id</th><td>{mapping.section_id} · {section?.title}</td></tr><tr><th>tested_concept_id</th><td>{mapping.tested_concept_id}</td></tr><tr><th>clinical_task</th><td>{mapping.clinical_task}</td></tr><tr><th>error_domain</th><td>{mapping.error_domain}</td></tr></tbody></table><MiniTranslation kind="knowledge-node" blocks={[{type:"heading",text:mapping.tested_concept_label},{type:"paragraph",text:`Clinical task: ${mapping.clinical_task}. Error domain: ${mapping.error_domain}. Located in ${section?.title??mapping.section_id}.`}]} translateAllEpoch={translateAllEpoch}/></article>
    <article className="panel canonical-chapter"><div className="sheet-head"><div><Badge>CANONICAL DISEASE / TOPIC CHAPTER</Badge><h2>{chapter?.title??mapping.chapter_id}</h2></div><Badge variant="outline">{sections.length} sections · reused by {mappedQuestions.length} mapped questions</Badge></div><p>持久化原创教材章节 · 默认连续展开。Current Guidance 保持为独立证据层，不由正文推断。</p><nav className="chapter-toc" aria-label="Chapter contents"><b>目录</b><div>{sections.map((item:any)=><a key={item.id} href={`#chapter-${item.id}`} className={item.id===mapping.section_id?"current":""}>{item.title}</a>)}</div></nav><MiniTranslation kind="chapter" blocks={translationBlocks} translateAllEpoch={translateAllEpoch}/><NoteEditor noteType="chapter" chapterId={mapping.chapter_id} notes={notes} onChange={onNoteChange}/><div className="chapter-sections">{sections.map((item:any)=><section id={`chapter-${item.id}`} key={item.id} className={cn("chapter-section",item.id===mapping.section_id&&"current")}><header><h3>{item.title}</h3>{item.id===mapping.section_id&&<Badge>本题所在</Badge>}</header><p className="chapter-lead chapter-prose"><WordText text={item.body} onWord={onWord}/></p><div className="chapter-content">{(Array.isArray(item.blocks)?item.blocks:[]).map((rawBlock:any,index:number)=>{const block=normalizeChapterBlock(rawBlock);return block?<ChapterRichBlock key={index} block={block} onWord={onWord}/>:null})}{item.id==="my_weak_points"&&<p className="muted chapter-prose">Concept: {mapping.tested_concept_label} · evidence {evidence.length}</p>}</div></section>)}</div></article>
    <article className={cn("panel","personal-weakness",wrongConfident>0&&"high-risk")}><p className="kicker">YOUR PERSONAL WEAKNESS · CONCEPT LEVEL</p><h2>{mapping.tested_concept_label}</h2>{evidence.length?<div className="calibration"><span>Wrong + Confident <b>{wrongConfident}</b></span><span>Correct + Guess <b>{hiddenWeakness}</b></span><span>Total evidence <b>{evidence.length}</b></span></div>:<p className="empty">该 concept 尚无个人作答证据；不会把未评估误报为薄弱。</p>}<Button onClick={()=>onPractice(undefined,mapping.tested_concept_id)}>Start same-concept targeted practice</Button></article>
    <article className="panel next-review"><p className="kicker">NEXT REVIEW · FSRS</p>{card?<><h2>{new Date(card.due_at).toLocaleString()}</h2><div className="calibration"><span>stability <b>{Number(card.stability).toFixed(2)}</b></span><span>difficulty <b>{Number(card.difficulty).toFixed(2)}</b></span><span>scheduled <b>{Number(card.scheduled_days).toFixed(2)} d</b></span><span>state <b>{card.state}</b></span></div><p className="muted">由上一状态、间隔与本次 rating 动态计算；不是 1/3/7/30 日固定桶。</p></>:<p className="empty">提交该概念的首个答案后创建 FSRS 状态。</p>}</article>
  </section>
}
function NoteEditor({noteType,questionId=null,chapterId=null,sectionId=null,notes,onChange,expanded=false}:{noteType:"question"|"chapter";questionId?:string|null;chapterId?:string|null;sectionId?:string|null;notes:NoteRow[];onChange:(note:NoteRow|null,scopeKey:string)=>void;expanded?:boolean}){
  const scopeKey=noteType==="question"?`question:${questionId}`:`chapter:${chapterId}:${sectionId??"all"}`;
  const existing=notes.find((row)=>row.scope_key===scopeKey);
  const [body,setBody]=useState(existing?.body??""),[status,setStatus]=useState(""),[savedAt,setSavedAt]=useState(existing?.updated_at??"");
  // An empty note stays compact: a reserved multi-line editor used to add a large
  // blank block to the left column before any chapter content.
  const [open,setOpen]=useState(Boolean(existing?.body));
  const persisted=useRef(existing?.body??""),areaRef=useRef<HTMLTextAreaElement|null>(null);
  useEffect(()=>{const value=existing?.body??"";setBody(value);persisted.current=value;setSavedAt(existing?.updated_at??"");setStatus("");setOpen(Boolean(value))},[scopeKey]);
  useEffect(()=>{if(body===persisted.current)return;setStatus("待自动保存");const timer=setTimeout(async()=>{setStatus("保存中…");try{const response=await fetch("/api/notes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({noteType,questionId,chapterId,sectionId,body})});const payload:any=await response.json();if(!response.ok)throw new Error(payload.error);persisted.current=body;setSavedAt(payload.note.updated_at);setStatus("已自动保存");onChange(payload.note,scopeKey)}catch{setStatus("保存失败，请继续保留此页面后重试")}},700);return()=>clearTimeout(timer)},[body,scopeKey]);
  const grow=()=>{const node=areaRef.current;if(!node)return;node.style.height="auto";node.style.height=`${node.scrollHeight}px`};
  useEffect(()=>{if(open)requestAnimationFrame(grow)},[open,body,scopeKey]);
  // Optimistic delete: the editor clears immediately, and a failed request restores
  // the text. A 2 s server round trip otherwise looked like the button did nothing.
  const remove=async()=>{const snapshot=body;persisted.current="";setBody("");setStatus("已删除");try{const response=await fetch("/api/notes",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({noteType,questionId,chapterId,sectionId})});if(!response.ok)throw new Error("delete failed");setSavedAt("");onChange(null,scopeKey);setOpen(false)}catch{persisted.current=snapshot;setBody(snapshot);setStatus("删除失败，请重试")}};
  const label=noteType==="question"?"Question Note":"Chapter Note";
  if(!expanded&&!open)return <section className="note-editor compact"><div className="note-head"><div><StickyNote/><b>{label}</b></div><Button variant="ghost" size="sm" onClick={()=>setOpen(true)}>+ 添加笔记</Button></div></section>;
  return <section className="note-editor"><div className="note-head"><div><StickyNote/><b>{label}</b></div><div className="note-head-actions">{(existing||body)&&<Button variant="ghost" size="sm" onClick={remove}><Trash2/>删除</Button>}{!expanded&&!body&&<Button variant="ghost" size="sm" onClick={()=>setOpen(false)}>收起</Button>}</div></div><textarea ref={areaRef} className="grow" value={body} onChange={(event)=>setBody(event.target.value)} onInput={grow} rows={4} placeholder={noteType==="question"?"记录本题线索、错误原因或待复习点（支持纯文本 / Markdown）":"记录本章框架、机制或复习问题（同章题目共享）"}/><div className="note-meta"><span>{status||"修改后 0.7 秒自动保存"}</span>{savedAt&&<time>{new Date(savedAt).toLocaleString()}</time>}</div></section>
}
/**
 * Floating notes.
 *
 * The note used to sit at the bottom of the question card, so copying a passage
 * from the explanation meant scrolling all the way back up to write it down.
 * It is now a floating window opened from a fixed button: the learner selects text
 * in the explanation, opens the window, pastes and closes it without losing place.
 *
 * Closing hides the window instead of unmounting it, so the 0.7 s autosave timer
 * keeps running and typed text is not lost; switching questions remounts it.
 */
const NOTE_PANEL_POS_KEY="amc.note.panel.pos.v1";
function FloatingNotes({noteType,questionId=null,chapterId=null,sectionId=null,notes,onChange,dictOpen=false}:{noteType:"question"|"chapter";questionId?:string|null;chapterId?:string|null;sectionId?:string|null;notes:NoteRow[];onChange:(note:NoteRow|null,scopeKey:string)=>void;dictOpen?:boolean}){
  const scopeKey=noteType==="question"?`question:${questionId}`:`chapter:${chapterId}:${sectionId??"all"}`;
  const existing=notes.find((row)=>row.scope_key===scopeKey);
  const [open,setOpen]=useState(false),[mounted,setMounted]=useState(false),[collapsed,setCollapsed]=useState(false);
  const [pos,setPos]=useState<{x:number;y:number}|null>(null);
  const posRef=useRef<{x:number;y:number}|null>(null);
  const drag=useRef<{dx:number;dy:number;w:number;h:number}|null>(null);
  useEffect(()=>{posRef.current=pos},[pos]);
  useEffect(()=>{
    try{const raw=window.localStorage.getItem(NOTE_PANEL_POS_KEY);if(raw){const parsed=JSON.parse(raw);if(typeof parsed?.x==="number"&&typeof parsed?.y==="number")setPos({x:parsed.x,y:parsed.y})}}catch{}
  },[]);
  // On a phone the dictionary is a full-width bottom bar; while it is open the
  // launcher moves to the top edge as a compact icon so it can never cover the
  // translation (a measured offset proved unreliable across the portal boundary).
  function startDrag(event:React.PointerEvent){
    // Dragging is available on phones too: the previous fixed bottom sheet covered
    // the dictionary bar and could not be moved out of the way.
    const panel=(event.currentTarget as HTMLElement).closest(".note-float") as HTMLElement|null;
    if(!panel)return;
    const rect=panel.getBoundingClientRect();
    drag.current={dx:event.clientX-rect.left,dy:event.clientY-rect.top,w:rect.width,h:rect.height};
    // A synthetic or already-released pointer id makes setPointerCapture throw; that
    // must not abort the React event handler (it surfaced as a dev error overlay).
    try { panel.setPointerCapture?.(event.pointerId); } catch { /* pointer not capturable */ }
  }
  function moveDrag(event:React.PointerEvent){
    if(!drag.current)return;
    const {dx,dy,w,h}=drag.current;
    const x=Math.min(Math.max(8,event.clientX-dx),Math.max(8,window.innerWidth-w-8));
    const y=Math.min(Math.max(8,event.clientY-dy),Math.max(8,window.innerHeight-h-8));
    setPos({x,y});
  }
  function endDrag(){
    if(!drag.current)return;
    const {w,h}=drag.current;
    drag.current=null;
    const current=posRef.current;
    if(!current)return;
    // Snap to the nearest viewport edge so the window never floats in the middle of
    // the text, and stays out of the way of the dictionary bar.
    const vw=window.innerWidth,vh=window.innerHeight,margin=12;
    const distances:Record<string,number>={left:current.x,right:vw-current.x-w,top:current.y,bottom:vh-current.y-h};
    const edge=Object.keys(distances).reduce((best,key)=>distances[key]<distances[best]?key:best,"left");
    const next={...current};
    if(edge==="left")next.x=margin;
    if(edge==="right")next.x=Math.max(8,vw-w-margin);
    if(edge==="top")next.y=margin;
    if(edge==="bottom")next.y=Math.max(8,vh-h-margin);
    next.x=Math.min(Math.max(8,next.x),Math.max(8,vw-w-8));
    next.y=Math.min(Math.max(8,next.y),Math.max(8,vh-h-8));
    setPos(next);
    posRef.current=next;
    try{window.localStorage.setItem(NOTE_PANEL_POS_KEY,JSON.stringify(next))}catch{}
  }
  function toggle(){
    if(open){setOpen(false);return}
    setMounted(true);setOpen(true);setCollapsed(false);
  }
  return <>
    <button type="button" className={cn("notes-fab",existing?.body&&"has-note",open&&"is-hidden",dictOpen&&"at-top")} onClick={toggle} aria-label="打开笔记" aria-expanded={open} data-testid="notes-fab"><StickyNote size={16}/><span>笔记</span>{existing?.body?<i>已记</i>:null}</button>
    {mounted&&createPortal(<aside
      className={cn("note-float",!!pos&&"moved",collapsed&&"collapsed",!open&&"is-hidden")}
      style={pos?{left:pos.x,top:pos.y,right:"auto",bottom:"auto"}:undefined}
      aria-label="笔记 / notes" data-testid="note-float" data-state={open?"open":"hidden"}>
      <header className="nf-head">
        <div className="nf-title" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} title="拖动可移动笔记窗">
          <span className="nf-kicker">笔记 · 自动保存</span>
          <b>本题笔记</b>
          <small>{existing?.body?"已保存 · 可继续粘贴解析":"选中解析复制后，随时粘贴到这里"}</small>
        </div>
        <div className="nf-tools">
          <button type="button" onClick={()=>setCollapsed((value)=>!value)} title={collapsed?"展开笔记":"折叠笔记"}>{collapsed?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>
          <button type="button" onClick={()=>setOpen(false)} title="关闭笔记"><X size={15}/></button>
        </div>
      </header>
      {!collapsed&&<div className="nf-body"><NoteEditor expanded noteType={noteType} questionId={questionId} chapterId={chapterId} sectionId={sectionId} notes={notes} onChange={onChange}/></div>}
    </aside>,document.body)}
  </>;
}

function NotesView({notes,questions,chapters}:{notes:NoteRow[];questions:any[];chapters:any[]}){const [query,setQuery]=useState(""),[filter,setFilter]=useState("all");const shown=notes.filter((note)=>filter==="all"||note.note_type===filter).filter((note)=>`${note.body} ${note.question_id??""} ${note.chapter_id??""}`.toLowerCase().includes(query.toLowerCase()));return <section className="content-page"><h1>My Notes</h1><p>个人笔记与证据状态完全分离；翻译、判分、FSRS 和 Current Guidance 均不会读取笔记内容。</p><div className="notes-toolbar"><label><Search/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="搜索笔记"/></label><select value={filter} onChange={(event)=>setFilter(event.target.value)}><option value="all">全部</option><option value="question">Question Note</option><option value="chapter">Chapter Note</option></select></div>{shown.length?<div className="notes-list">{shown.map((note)=>{const question=questions.find((row:any)=>row.id===note.question_id);const chapter=chapters.find((row:any)=>row.id===note.chapter_id);return <article className="panel" key={note.id}><div className="note-head"><Badge variant="outline">{note.note_type==="question"?"QUESTION":"CHAPTER"}</Badge><time>{new Date(note.updated_at).toLocaleString()}</time></div><h2>{question?.topic??chapter?.title??note.question_id??note.chapter_id}</h2><pre>{note.body}</pre></article>})}</div>:<p className="empty">没有符合当前筛选的笔记。</p>}</section>}
function GuidelineUpdates({questions,options,guidanceById,nodes,links,onStart,translateAllEpoch}:{questions:any[];options:any[];guidanceById:Map<string,Guidance>;nodes:any[];links:any[];onStart:()=>void;translateAllEpoch:number}){const updated=questions.filter((question)=>guidanceById.get(question.id)?.isUpdated);return <section className="content-page"><div className="hero-row compact"><div><p className="kicker">CURRENT PRACTICE SAFETY</p><h1>Guideline Updates</h1><p>只收录已有澳洲权威证据、且旧题答案或理由发生变化的项目。</p></div><Button disabled={!updated.length} onClick={onStart}><RefreshCw/>开始专项复习</Button></div>{updated.length?<div className="stack">{updated.map((question)=>{const guidance=guidanceById.get(question.id)!;const node=nodes.find((n:any)=>n.id===links.find((l:any)=>l.question_id===question.id&&l.relation_type==="primary")?.node_id);const source=optionLabel(options.filter((option)=>option.question_id===question.id),question.answer_key),current=guidance.status==="VERIFIED_UPDATED_NOT_IN_OPTIONS"?"None of the listed options":optionLabel(options.filter((option)=>option.question_id===question.id),guidance.currentAnswer);return <article className="knowledge update-card" key={question.id}><div><Badge variant="destructive">{guidance.status}</Badge><h2>{node?.canonical_name??question.topic}</h2><small>{node?.subtopics?.slice(0,3).join("、")}</small><p>{concise(question.stem_en,220)}</p><small>Source: {source} → Current: {current}</small><MiniTranslation kind="guideline-update" blocks={[{type:"paragraph",text:concise(question.stem_en,220)},{type:"table",rows:[["Source-era answer",source],["Current answer",current],["What changed",guidance.whatChanged??guidance.recommendation??"Verified update"]]}]} translateAllEpoch={translateAllEpoch}/></div><div><b>{guidance.verifiedAt}</b><span>{guidance.sources[0]?.title}</span></div></article>})}</div>:<p className="empty">当前没有符合 Evidence Gate 的更新记录；系统不会用未核验内容填满此页。</p>}</section>}
function Review({reviews,nodes}:{reviews:any[];nodes:any[]}){return <section className="content-page"><h1>到期复习</h1><p>优先级由 knowledge weakness × review due × misconception risk × confidence calibration 决定。</p>{reviews.length?<div className="stack">{reviews.map(r=>{const n=nodes.find(n=>n.id===r.node_id);return <div className="row-card" key={r.node_id}><BrainCircuit/><div><b>{n?.canonical_name??r.node_id}</b><span>due {new Date(r.due_at).toLocaleDateString()} · interval {r.interval_days} d</span></div><Badge variant={r.priority>=90?"destructive":"secondary"}>priority {Math.round(r.priority)}</Badge></div>})}</div>:<p className="empty">完成一题后会建立复习状态。</p>}</section>}
function Mistakes({attempts,questions}:{attempts:any[];questions:any[]}){const flagged=attempts.filter(a=>!a.correct||a.confidence==="guess");return <section className="content-page"><h1>错题与隐藏薄弱点</h1><p>“对但猜”与错误同样进入模型；“错且确定”优先级最高。</p>{flagged.length?<div className="stack">{flagged.map(a=>{const q=questions.find(q=>q.id===a.question_id);return <div className="row-card" key={a.id}>{!a.correct?<XCircle className="bad-icon"/>:<TriangleAlert className="warn-icon"/>}<div><b>{q?.topic}</b><span>{a.correct?"Correct but guess — hidden weakness":`Incorrect + ${a.confidence}`}</span></div><Badge variant={!a.correct&&a.confidence==="confident"?"destructive":"outline"}>{a.error_type??"hidden-weakness"}</Badge></div>})}</div>:<p className="empty">还没有薄弱点记录。</p>}</section>}
function Vocabulary({rows}:{rows:any[]}){return <section className="content-page"><h1>个人词汇本</h1><p>中文默认隐藏；点击后按需展开。每条都保留来源上下文与复习到期日。</p>{rows.length?<div className="vocab-grid">{rows.map(v=><details key={v.id} className="vocab"><summary><b>{v.lemma}</b><span>{v.part_of_speech}</span></summary><p>{v.translation_zh}</p><small>{v.contextual_meaning_zh}</small><p className="muted">{v.morphology_zh}</p></details>)}</div>:<p className="empty">点击题目、解析或 Coach 中的英文词，再加入词汇本。</p>}</section>}
function Knowledge({nodes,reviews,insights,questions,canonicalIndex,links,graph,guidanceById,onPractice}:{nodes:any[];reviews:any[];insights:any;questions:any[];canonicalIndex:any[];links:any[];graph:any;guidanceById:Map<string,Guidance>;onPractice:(id:string)=>void}){const [mode,setMode]=useState("map");const shown=mode==="weak"?insights.weak:mode==="due"?insights.due:mode==="gap"?insights.unassessed:insights.assessed;const activeIds=new Set(questions.map((q:any)=>q.id));return <section className="content-page"><h1>我的知识地图</h1><p>疾病与临床主题节点 · 真实作答生成掌握度，未评估不计为错误。</p>{graph&&<div className="import-note"><b>Knowledge Graph：{graph.mapped}/{graph.canonical} 已映射 · unmapped {graph.unmapped} · stable IDs PASS</b><p>明确疾病/主题词 {graph.mapping_status_counts?.MATCHED_ONTOLOGY??0}；正确答案主题 {graph.mapping_status_counts?.ANSWER_TOPIC??0}；题目标题主题 {graph.mapping_status_counts?.TITLE_TOPIC??0}；低置信任务级回退 {graph.mapping_status_counts?.TASK_LEVEL_FALLBACK??0}。任务级回退不会冒充具体诊断。</p></div>}<div className="knowledge-nav"><Button variant={mode==="map"?"default":"outline"} onClick={()=>setMode("map")}><MapIcon/>知识地图</Button><Button variant={mode==="weak"?"default":"outline"} onClick={()=>setMode("weak")}>薄弱知识</Button><Button variant={mode==="gap"?"default":"outline"} onClick={()=>setMode("gap")}>未评估</Button><Button variant={mode==="due"?"default":"outline"} onClick={()=>setMode("due")}>到期复习</Button></div><div className="stack">{shown.map((n:any)=>{const r=reviews.find((x:any)=>x.node_id===n.id);const ids=new Set(links.filter((l:any)=>l.node_id===n.id).map((l:any)=>l.question_id));const relatedAll=canonicalIndex.filter((q:any)=>ids.has(q.record_id));const related=questions.filter((q:any)=>ids.has(q.id));const updates=related.filter((q:any)=>guidanceById.get(q.id)?.isUpdated).length;const fallback=String(n.id).startsWith("topic:fallback:");return <article className="knowledge" key={n.id}><div><Badge variant="outline">{n.domain} · {relatedAll.length} 条记录 · {related.length} 道可练</Badge>{fallback&&<Badge variant="secondary">任务级回退</Badge>}<h2>{n.canonical_name}</h2><p>子主题：{n.subtopics?.slice(0,5).join("、")||n.clinical_task}{updates?` · 已核验指南更新 ${updates}`:""}</p><details><summary>查看关联题</summary><ul>{relatedAll.slice(0,12).map((q:any)=><li key={q.record_id}>{concise(q.stem,130)}{!activeIds.has(q.record_id)?"（仅保留记录）":""}</li>)}</ul></details><Button variant="outline" disabled={!related.length} onClick={()=>onPractice(n.id)}>按此主题专项练习</Button></div><div><b>{n.mastery===null?"未评估":`${n.mastery}% 掌握度`}</b><span>{n.status} · 已做 {n.uniqueQuestionCount} 道</span><span>{r?`下次复习 ${new Date(r.due_at).toLocaleDateString()}`:"尚无复习日"}</span></div></article>})}</div></section>}
function LibraryView({sources,bankStats}:{sources:any[];bankStats:any}){return <section className="content-page"><h1>资料库与导入</h1><p>原始资料保留在 Google Drive；D1 保存 canonical 记录、出处指针和个人学习数据。</p><div className="bank-stats"><Stat label="Canonical records" value={bankStats?.canonical_count??0} detail="v2.9.4 no-loss bank"/><Stat label="可安全刷题" value={bankStats?.active_count??0} detail="active quiz rotation"/><Stat label="视觉记录" value={bankStats?.visual_count??0} detail="asset pointer retained"/><Stat label="待当前证据核验" value={bankStats?.needs_verification_count??0} detail="not an import blocker"/></div><div className="compat"><h2>题库上线状态</h2><table><tbody><tr><th>Manual review</th><td>612 / 612 · unresolved 0</td></tr><tr><th>No-loss gate</th><td>{Number(bankStats?.canonical_count)===3621?"PASS":"等待最终导入"}</td></tr><tr><th>Source-page image mode</th><td>{bankStats?.image_mode_count??0} records retained</td></tr><tr><th>Excluded from rotation</th><td>{bankStats?.excluded_count??0} records preserved, not silently dropped</td></tr></tbody></table></div><div className="stack">{sources.map(s=><div className="row-card" key={s.id}><Database/><div><b>{s.name}</b><span>{s.import_status} · {s.copyright_scope}</span></div><Badge variant="outline">{s.current_guideline_status}</Badge></div>)}</div><div className="import-note"><b>v2.9.4 canonical bank</b><p>只有同时具备可判分 source answer 与安全选项呈现的记录进入主动轮转；其余记录完整保留，等待后续修复。</p><p>Current Evidence verification 与 source-era 判分层分离，不阻塞刷题上线。</p></div></section>}
