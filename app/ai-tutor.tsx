"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, LoaderCircle, MessageCircle, Minus, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type NoteRow={id:string;scope_key:string;note_type:"question"|"chapter";question_id?:string|null;chapter_id?:string|null;body:string;created_at:string;updated_at:string};
type DiagramBlock={type:"diagram";title?:string;caption?:string;nodes:string[]};
type QuestionImageBlock={type:"existing_question_image";title?:string;src:string;caption?:string;sourceUrl?:string};
type ExternalImageBlock={type:"trusted_external_image";title?:string;src:string;caption?:string;sourceName:string;sourceUrl:string;licence?:string;retrievedAt?:string};
type TutorBlock={type:"heading"|"paragraph"|"bullet_list"|"numbered_list"|"comparison_table"|"drug_table"|"algorithm"|"clinical_pearl"|"warning"|"exam_trap"|"takeaway";text?:string;title?:string;items?:string[];columns?:string[];rows?:string[][];steps?:Array<{label:string;detail?:string}>}|DiagramBlock|QuestionImageBlock|ExternalImageBlock;

function blockText(block:TutorBlock){if("text"in block&&block.text)return block.text;if("items"in block&&block.items)return block.items.join("；");if("rows"in block&&block.rows)return block.rows.map(row=>row.join("：")).join("；");if("steps"in block&&block.steps)return block.steps.map(step=>`${step.label}${step.detail?`：${step.detail}`:""}`).join("；");return "caption"in block?block.caption??"":""}
function wantsVisual(text:string){return /图片|图示|示意|图解|ecg|心电|x-ray|xray|ct|mri|影像|pathway|diagram|visual|流程图/i.test(text)}

function TutorDiagram({block}:{block:DiagramBlock}){return <figure className="tutor-diagram"><figcaption><b>{block.title??"教学机制示意图"}</b><span>原创教学示意图</span></figcaption><ol className="tutor-diagram-flow" aria-label={block.caption??block.title??"教学示意图"}>{block.nodes.slice(0,6).map((node,index)=><li key={`${node}-${index}`}><span>{index+1}</span><p>{node}</p></li>)}</ol>{block.caption&&<p className="tutor-diagram-caption">{block.caption}</p>}</figure>}

function TutorBlocks({blocks}:{blocks:TutorBlock[]}){return <div className="tutor-blocks">{blocks.map((block,index)=>{const key=`${block.type}-${index}`;if(block.type==="heading")return <h3 key={key}>{block.text}</h3>;if(block.type==="paragraph")return <p key={key}>{block.text}</p>;if(block.type==="bullet_list")return <ul key={key}>{block.items?.map((item,i)=><li key={i}>{item}</li>)}</ul>;if(block.type==="numbered_list")return <ol key={key}>{block.items?.map((item,i)=><li key={i}>{item}</li>)}</ol>;if(block.type==="comparison_table"||block.type==="drug_table")return <section className="tutor-table-block" key={key}>{block.title&&<h4>{block.title}</h4>}<div className="tutor-table-wrap"><table><thead><tr>{block.columns?.map((column,i)=><th key={i}>{column}</th>)}</tr></thead><tbody>{block.rows?.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></section>;if(block.type==="algorithm")return <section className="tutor-algorithm" key={key}>{block.title&&<h4>{block.title}</h4>}<ol>{block.steps?.map((step,i)=><li key={i}><span>{i+1}</span><div><b>{step.label}</b>{step.detail&&<p>{step.detail}</p>}</div></li>)}</ol></section>;if(block.type==="diagram")return <TutorDiagram key={key} block={block}/>;if(block.type==="existing_question_image")return <figure className="tutor-visual" key={key}><figcaption><b>{block.title??"当前题目图像"}</b><span>{block.caption??"SAFE visual · 原题图"}</span></figcaption><img src={block.src} alt={block.caption??"当前题目教学图像"}/>{block.sourceUrl&&<a href={block.sourceUrl} target="_blank" rel="noreferrer">查看题目来源 <ExternalLink/></a>}</figure>;if(block.type==="trusted_external_image")return <figure className="tutor-visual" key={key}><figcaption><b>{block.title??"可信教学图"}</b><span>{block.sourceName}{block.licence?` · ${block.licence}`:""}</span></figcaption><img src={block.src} alt={block.caption??block.title??"可信教学图"}/><a href={block.sourceUrl} target="_blank" rel="noreferrer">{block.sourceName} · 来源与授权 <ExternalLink/></a></figure>;return <aside className={`tutor-callout ${block.type}`} key={key}><b>{block.title??(block.type==="exam_trap"?"AMC 高频陷阱":block.type==="takeaway"?"一句话记忆":block.type==="warning"?"注意":"Clinical pearl")}</b><p>{block.text}</p></aside>})}</div>}

export function AITutor({question,selectedAnswer,confidence,chapterId,notes,onNoteChange}:{question:any;selectedAnswer:string;confidence:string;chapterId:string|null;notes:NoteRow[];onNoteChange:(note:NoteRow|null,scopeKey:string)=>void}){
  const [open,setOpen]=useState(false),[minimized,setMinimized]=useState(false),[input,setInput]=useState(""),[messages,setMessages]=useState<any[]>([]),[loading,setLoading]=useState(false),[status,setStatus]=useState(""),[mobile,setMobile]=useState(false),[viewportFrame,setViewportFrame]=useState({height:0,top:0});
  const composerRef=useRef<HTMLTextAreaElement>(null),threadRef=useRef<HTMLDivElement>(null),composing=useRef(false),submitting=useRef(false),stickToBottom=useRef(true);
  useEffect(()=>{const media=window.matchMedia("(max-width:700px), (pointer:coarse)");const update=()=>setMobile(media.matches);update();media.addEventListener?.("change",update);return()=>media.removeEventListener?.("change",update)},[]);
  useEffect(()=>{if(!open||!mobile||minimized)return;const viewport=window.visualViewport,scrollY=window.scrollY,previous={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};const update=()=>setViewportFrame({height:Math.round(viewport?.height??window.innerHeight),top:Math.round(viewport?.offsetTop??0)});update();viewport?.addEventListener("resize",update);viewport?.addEventListener("scroll",update);document.body.style.position="fixed";document.body.style.top=`-${scrollY}px`;document.body.style.width="100%";document.body.style.overflow="hidden";return()=>{viewport?.removeEventListener("resize",update);viewport?.removeEventListener("scroll",update);Object.assign(document.body.style,previous);window.scrollTo(0,scrollY)}},[open,mobile,minimized]);
  useEffect(()=>{const area=composerRef.current;if(!area)return;area.style.height="auto";area.style.height=`${Math.min(Math.max(area.scrollHeight,52),144)}px`},[input]);
  useEffect(()=>{if(stickToBottom.current&&threadRef.current)threadRef.current.scrollTop=threadRef.current.scrollHeight},[messages,loading,status]);
  const ask=async(override?:string,forceEvidence=false)=>{
    const text=(override??input).trim();
    if(!text||loading||submitting.current)return;
    submitting.current=true;stickToBottom.current=true;
    const history=[...messages.slice(-8),{role:"user",content:text}];
    setMessages(history);setInput("");setLoading(true);
    setStatus(wantsVisual(text)?"正在准备题图、可信教学图或示意图…":forceEvidence||/最新|现在|指南|联网|查询|检索|核实/i.test(text)?"正在联网检索权威来源（约 5–10 秒）…":"正在读取当前章节与 Knowledge Node…");
    const id=crypto.randomUUID();
    const applyAnswer=(body:any)=>{
      setMessages(current=>{
        const exists=current.some(message=>message.id===id);
        const next=exists
          ?current.map(message=>message.id===id?{...message,content:body.answer_summary,blocks:[],citations:body.citations??[],evidence:body.evidence,live:body.live,sources:null}:message)
          :[...current,{id,role:"assistant",content:body.answer_summary,blocks:[],citations:body.citations??[],evidence:body.evidence,live:body.live}];
        return next;
      });
      (body.blocks??[]).forEach((block:any,index:number)=>setTimeout(()=>setMessages(current=>current.map(message=>message.id===id?{...message,blocks:[...(message.blocks??[]),block]}:message)),index*45));
    };
    try{
      // Streaming: the server pushes the fetched sources first, so the learner sees
      // "N sources found" while the model is still writing.
      const response=await fetch("/api/ai-tutor?stream=1",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({questionId:question.id,message:text,selectedAnswer:selectedAnswer||undefined,confidence,forceEvidence,history:history.slice(0,-1).map((turn:any)=>({role:turn.role,content:turn.role==="assistant"?[turn.content,...(turn.blocks??[]).map(blockText)].filter(Boolean).join("\n"):turn.content}))})});
      if(!response.ok||!response.body){
        const body:any=await response.json().catch(()=>({}));
        throw new Error(body.error||"AI Tutor 暂时不可用");
      }
      const reader=response.body.getReader(),decoder=new TextDecoder();
      let buffer="",answered=false;
      while(true){
        const {value,done}=await reader.read();
        if(done)break;
        buffer+=decoder.decode(value,{stream:true});
        let split:number;
        while((split=buffer.indexOf("\n\n"))>=0){
          const chunk=buffer.slice(0,split);buffer=buffer.slice(split+2);
          const line=chunk.split("\n").find((part)=>part.startsWith("data: "));
          if(!line)continue;
          let event:any;
          try{event=JSON.parse(line.slice(6))}catch{continue}
          if(event.type==="sources"){
            setMessages(current=>[...current.filter((message)=>message.id!==id),{id,role:"assistant",content:"",blocks:[],citations:[],evidence:null,sources:event.sources??[]}]);
          }else if(event.type==="answer"){
            answered=true;applyAnswer(event);
          }else if(event.type==="error"){
            throw new Error(event.message||"AI Tutor 暂时不可用");
          }
        }
      }
      if(!answered)throw new Error("AI Tutor 暂时不可用；题目、章节与笔记均未改变。");
    }catch(error:any){
      setMessages(current=>[...current.filter((message)=>message.id!==id),{role:"assistant",content:error.message||"AI Tutor 暂时不可用；题目、章节与笔记均未改变。",error:true}]);
      setLoading(false);setStatus("");
    }finally{submitting.current=false;setLoading(false);setStatus("");}
  };
  const saveAnswer=async(noteType:"question"|"chapter")=>{const latest=[...messages].reverse().find(message=>message.role==="assistant"&&!message.error);if(!latest)return;const scopeKey=noteType==="question"?`question:${question.id}`:`chapter:${chapterId}:all`,existing=notes.find(note=>note.scope_key===scopeKey),answer=[latest.content,...(latest.blocks??[]).map(blockText)].filter(Boolean).join("\n\n"),body=[existing?.body?.trim(),`## AI Tutor · ${new Date().toLocaleString()}`,answer].filter(Boolean).join("\n\n");setStatus("正在保存到笔记…");try{const response=await fetch("/api/notes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({noteType,questionId:noteType==="question"?question.id:null,chapterId:noteType==="chapter"?chapterId:null,body})});const payload:any=await response.json();if(!response.ok)throw new Error(payload.error);onNoteChange(payload.note,scopeKey);setStatus(noteType==="chapter"?"已保存到 Chapter Note。":"已保存到 Question Note。")}catch{setStatus("笔记未保存；AI 对话仍保留在当前页面。")}};
  const close=()=>{setMinimized(false);setOpen(false)};
  return <><button className="ai-tutor-launch" onClick={()=>{setOpen(true);setMinimized(false)}} aria-label="打开 AI Tutor"><MessageCircle/><span>问 AI</span></button>{open&&<aside className={`ai-tutor ${minimized?"minimized":""} ${mobile?"mobile":""}`} style={mobile&&!minimized&&viewportFrame.height?{height:viewportFrame.height,top:viewportFrame.top}:undefined} aria-label="AI Tutor"><header><div><MessageCircle/><div><b>AI Tutor</b><small>{chapterId?"当前题目 · 当前章节上下文":"当前题目上下文"}</small><span className="auto-evidence">联网检索：按需 · 澳洲权威源</span></div></div><div><button onClick={()=>setMinimized(value=>!value)} aria-label="最小化"><Minus/></button><button onClick={close} aria-label="关闭">×</button></div></header>{!minimized&&<><div className="ai-tutor-tools"><button disabled={loading} onClick={()=>void ask("请联网检索澳洲权威指南，说明这个问题的最新推荐，并给出来源。")}><RefreshCw/>联网核验最新指南</button></div><div className="ai-tutor-thread" ref={threadRef} onScroll={event=>{const node=event.currentTarget;stickToBottom.current=node.scrollHeight-node.scrollTop-node.clientHeight<48}}>{!messages.length&&<p className="muted">问概念、推理或本节总结；涉及最新指南、剂量或筛查时会实时联网检索澳洲权威来源，并给出可点开的出处。</p>}{messages.map((message,index)=><article key={message.id??index} className={`ai-message ${message.role}${message.error?" error":""}`}>{message.sources?.length>0&&!message.content&&<p className="tutor-preparing"><LoaderCircle/>已找到 {message.sources.length} 个来源，正在生成回答…</p>}{message.evidence&&<div className={`tutor-evidence ${message.evidence.mode}`}><b>{message.evidence.label}</b>{message.evidence.sourceCount>0&&<span>{message.evidence.sourceCount} authoritative source{message.evidence.sourceCount>1?"s":""}{message.evidence.verifiedAt?` · ${new Date(message.evidence.verifiedAt).toLocaleDateString()}`:""}</span>}</div>}{message.live&&<p className="tutor-channels">{`本次各通道：澳洲 ${message.live.australian?.examined??0} · PubMed ${message.live.pubmed?.count??0} · NHS ${message.live.nhs?.count??0} · Europe PMC ${message.live.europepmc?.count??0}`}{(()=>{const errors=[message.live.australian,message.live.pubmed,message.live.nhs,message.live.europepmc,message.live.fallback].map((channel:any)=>channel?.error).filter(Boolean);return errors.length?` · 失败：${errors.slice(0,2).join(" / ")}`:""})()}</p>}<p className="tutor-summary">{message.content}</p>{message.blocks?.length?<TutorBlocks blocks={message.blocks}/>:null}{message.citations?.length?<div className="ai-citations"><b>Sources</b>{message.citations.map((source:any,i:number)=><a key={`${source.url}-${i}`} href={source.url} target="_blank" rel="noreferrer"><b>{source.issuingBody??"Australian authority"}</b><span>{source.title}{source.documentDate?` · ${source.documentDate}`:""} · retrieved {source.retrievalDate??"recorded"}</span><ExternalLink/></a>)}</div>:null}{message.role==="assistant"&&!message.error&&<div className="ai-save"><button onClick={()=>saveAnswer("question")}>保存到 Question Note</button>{chapterId&&<button onClick={()=>saveAnswer("chapter")}>保存到 Chapter Note</button>}</div>}</article>)}{loading&&<div className="ai-thinking"><LoaderCircle/> {status||"AI 正在回答…"}</div>}</div>{status&&!loading&&<p className="ai-status">{status}</p>}<form className="tutor-composer" onSubmit={event=>{event.preventDefault();void ask()}}><textarea ref={composerRef} value={input} onChange={event=>setInput(event.target.value)} onCompositionStart={()=>{composing.current=true}} onCompositionEnd={()=>{composing.current=false}} onKeyDown={event=>{if(mobile||event.key!=="Enter"||event.shiftKey||event.nativeEvent.isComposing||composing.current||event.nativeEvent.keyCode===229)return;event.preventDefault();void ask()}} enterKeyHint="enter" placeholder="例如：为什么这里不是 digoxin？" rows={1}/><div className="tutor-composer-actions"><span>{loading?"AI 正在生成…":"点击发送"}</span><Button type="submit" size="sm" disabled={!input.trim()||loading}><Send/>发送</Button></div></form></>}</aside>}</>}
