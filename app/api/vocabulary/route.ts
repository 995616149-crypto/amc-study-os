import { z } from "zod";
import { db, ensureUser, currentUser} from "../_shared";

// Dictionary entries do not always carry every explanatory field. Rejecting the
// whole save for a missing mnemonic made the UI roll back to "加入词汇本" a few
// seconds after the user added the word, so optional text fields default to "".
const optionalText = (max: number) => z.string().max(max).nullish().transform((value) => value ?? "");
const Word = z.object({
  lemma: z.string().min(1).max(100), surfaceForm: z.string().min(1).max(100),
  partOfSpeech: optionalText(60), translationZh: z.string().min(1).max(300),
  contextualMeaningZh: optionalText(500), morphologyZh: optionalText(500),
  etymologyZh: optionalText(500), mnemonicZh: optionalText(500),
  sourceQuestionId: z.string().nullish().transform((value) => value ?? null),
  sourceContext: optionalText(1000),
});
const Remove = z.object({ lemma:z.string().min(1).max(100) });

export async function GET(request: Request) {
  const user=await currentUser(request); if(!user) return Response.json({error:"Sign in required"},{status:401});
  try {
    const userId=await ensureUser(user);
    const rows=await db().prepare(`SELECT lemma,surface_form,translation_zh,created_at,due_at,status FROM vocabulary WHERE user_id=? ORDER BY created_at DESC`).bind(userId).all();
    return Response.json({ words: rows.results, lemmas: rows.results.map((row:any)=>String(row.lemma)) });
  } catch(error){ console.error("vocabulary_list_failed",error); return Response.json({error:"词汇本暂时不可用。"},{status:503}); }
}

export async function POST(request: Request) {
  const user=await currentUser(request); if(!user) return Response.json({error:"Sign in required"},{status:401});
  const parsed=Word.safeParse(await request.json().catch(()=>null)); if(!parsed.success) return Response.json({error:"Invalid word"},{status:400});
  try {
    const userId=await ensureUser(user); const now=new Date(); const due=new Date(now.getTime()+86400000).toISOString(); const w=parsed.data;
    await db().prepare(`INSERT INTO vocabulary (id,user_id,lemma,surface_form,part_of_speech,translation_zh,contextual_meaning_zh,morphology_zh,etymology_zh,mnemonic_zh,source_question_id,source_context,created_at,due_at,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(user_id,lemma) DO UPDATE SET surface_form=excluded.surface_form, contextual_meaning_zh=excluded.contextual_meaning_zh, source_context=excluded.source_context, due_at=excluded.due_at`)
      .bind(crypto.randomUUID(),userId,w.lemma,w.surfaceForm,w.partOfSpeech,w.translationZh,w.contextualMeaningZh,w.morphologyZh,w.etymologyZh,w.mnemonicZh,w.sourceQuestionId,w.sourceContext,now.toISOString(),due,"learning").run();
    const saved=await db().prepare(`SELECT lemma,surface_form,translation_zh,created_at,due_at,status FROM vocabulary WHERE user_id=? AND lemma=?`)
      .bind(userId,w.lemma).first();
    return Response.json({ok:true, added:true, word:saved});
  } catch(error){ console.error("vocabulary_failed",error); return Response.json({error:"The word could not be saved. Please retry."},{status:503}); }
}

export async function DELETE(request: Request) {
  const user=await currentUser(request); if(!user) return Response.json({error:"Sign in required"},{status:401});
  const parsed=Remove.safeParse(await request.json().catch(()=>null)); if(!parsed.success) return Response.json({error:"Invalid word"},{status:400});
  try {
    const userId=await ensureUser(user);
    const existing=await db().prepare(`SELECT lemma FROM vocabulary WHERE user_id=? AND lemma=?`).bind(userId,parsed.data.lemma).first();
    await db().prepare(`DELETE FROM vocabulary WHERE user_id=? AND lemma=?`).bind(userId,parsed.data.lemma).run();
    return Response.json({ok:true, removed:Boolean(existing), idempotent:!existing});
  } catch(error){ console.error("vocabulary_remove_failed",error); return Response.json({error:"The word could not be removed. Please retry."},{status:503}); }
}
