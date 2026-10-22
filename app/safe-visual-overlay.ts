// SAFE v2.9.6 is a presentation-only overlay. It intentionally does not
// persist anything to D1 and matches canonical IDs exactly.
export const SAFE_ATTACH_RECORD_IDS = new Set([
  "5e1480d1d9778f39b23a","cf936456c5ec862e1724","fc650b6ba3137a1037fd","22bbe3437e51330dc410","f3a6cbacf74c5c166af0","cd1a855aaa849e8fc41c","499751b7c949c8604b1f","0834a6f3487694a8e4bc","c7abe42fe80006f83fe9","8d0dd78bb4ebe573d878","e11e563f003e9b578917","1f0a92304a23d605db13","11a7a4ee39548e81dc86","afd34247c68f38a02d15","b5bb6da96300c6735569","29e55857c50ab5616ba1","91bc957e58abd6b4a5a3","f26a1fe666b47452220a","f8cc408a7e894b27110b","22ccdc2ee34f6fb7a210","6b7ae21bd89260765761","2c0aab63e226d891ea07","ef682b9aaf259deb24dd","847a5647c54cc416dbf3","d6fd735244b24e030e34","80c2d1e6ce4142b74386","c2de2e815ec58afd259b","55820fef624dfa7a62eb","079d5b12bed300b05825","1f02fbb5f7222892b094","bf4f5f4e9b8f96ab4f1d","fe6e3bef37d81f3b34aa","02a574870461e7bafc73","f1b8538171a4a3d01c39","8b326c6d47692433fe7a","2ead966c4e2784908e68","dcb0f7d6d3257a527b4b","41115eb5ac0766eb2a0b","cfd3da1f1a92084fe9f7","3d05084b061bf254c332","d3b15a9b0517e2cf9d66","5b5ed09697eaa5d0b71c","5a9a4daac5cdfd3af270","f05fdefa337be53e167b","fd8bc9dd16a082d95309","40a6d84fffb3177fa80a","657c74eb0491561c195a","4322a1452ebc35e08858","e307a419f1c93b122650","c3125bf6016ad056c687","e207f7fd03329b7ebd87","32bebf4147bb88918f91","a2b5ac9e2b132c2241da","1ded5a913919216b7dba","72472a896b4beafd0807","6e112026c8931d7eeb45","dded2bf5ca85dd3f986c","008089fac064a6c9d88a","db1be21c85cd30564006","5554f48452e592723d9d","3dfc90177b1f3c58ad06","2040ad223c4af045d727","dd213acd425432decea9","c37e7ef846a892225fa4","68b425524e390aa60f83","ef8be5081f7ee3423663","b9dcb5311b7e739d825e","0f68d0f5b91b05149c79","fd964706e4112648ae67","7254fcb612a28f874111","385718d545ce60847633","09ede414109cc0efc32d","1716f4c2f426183fc2b9","6d7af66e1bac502f8f3b","fe19963abfef557c6f5b","e05ce809b0f22f6b8b6c","abcbb5a14a13db27c910","9520b71514cc5c8d6457","3d86b5b6730b04872acd","d35d3a03fac0992bc571","ed7634a6755f8aed37cd","2ef52155436d6855971c","661190c68649591f3d26","265599ce3c33b3f4c169","21aca31e9088f6c19a40","b6d1200cc4c94e31927f","1d31c1818edbb99e9e7a","d4c0689b0ef98b6c35b6","e3b0877b7eef04623f9e","162d39f21206305b1cf2"
]);

export const SAFE_SUPPRESS_RECORD_IDS = new Set([
  "ee63ba10c2c04a183301",
  "02bf1be5e0a7dd10687d",
]);

export function resolveSafeVisualOverlay(recordId: string | undefined, originalVisualAsset: string | null | undefined) {
  if (recordId && SAFE_ATTACH_RECORD_IDS.has(recordId)) {
    return { effectiveVisualAsset: `/safe-visual-v2-9-6/${recordId}.jpg`, effectiveVisualQuestion: true };
  }
  if (recordId && SAFE_SUPPRESS_RECORD_IDS.has(recordId)) {
    return { effectiveVisualAsset: null, effectiveVisualQuestion: false };
  }
  return { effectiveVisualAsset: originalVisualAsset ?? null, effectiveVisualQuestion: Boolean(originalVisualAsset) };
}
