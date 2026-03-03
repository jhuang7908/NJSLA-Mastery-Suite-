// NJSLA Grade 3 ELA + Chinese – assembled from component files
// ELA sets 1-3 are defined in ela_sets1to3.js  (elaSet1, elaSet2, elaSet3)
// ELA sets 4-6 are defined in ela_sets4to6.js  (elaSet4, elaSet5, elaSet6)

const elaDB = {
    set1: elaSet1,
    set2: elaSet2,
    set3: elaSet3,
    set4: elaSet4,
    set5: elaSet5,
    set6: elaSet6
};

// ── Chinese ──────────────────────────────────────────────────
const chineseDB = {
    set1: [
        { q: "拼音：'苹果'的正确拼音？", a: ["píng gǔo", "píng guǒ", "pīng guǒ", "pīng gǔo"], c: 1, exp: "苹果 = píng guǒ（第二声+第三声）。", tag: "拼音" },
        { q: "量词：一___书", a: ["个", "只", "本", "条"], c: 2, exp: "书的量词是'本'。", tag: "量词" },
        { q: "'森林'是什么意思？", a: ["Forest", "Mountain", "Ocean", "Desert"], c: 0, exp: "森林 = Forest（树木茂盛的地方）。", tag: "识字" },
        { q: "'快'的反义词？", a: ["跑", "慢", "高", "大"], c: 1, exp: "快慢相对。", tag: "反义词" },
        { q: "选出正确句子：", a: ["我吃饭喜欢", "喜欢我饭吃", "我喜欢吃饭", "饭吃我喜欢"], c: 2, exp: "中文语序：主语+谓语+宾语。", tag: "句法" }
    ],
    set2: [
        { q: "'日'代表什么？", a: ["Moon", "Sun", "Star", "Cloud"], c: 1, exp: "日是太阳的象形字。", tag: "识字" },
        { q: "填空：他___吃苹果。（表示喜欢）", a: ["不", "很", "喜欢", "难"], c: 2, exp: "喜欢 = to like.", tag: "词汇" },
        { q: "'八十五'用阿拉伯数字写是？", a: ["58", "85", "805", "850"], c: 1, exp: "八十五 = 80+5 = 85。", tag: "数字" },
        { q: "'明天'是什么意思？", a: ["Yesterday", "Today", "Tomorrow", "Morning"], c: 2, exp: "明天 = Tomorrow。", tag: "词汇" },
        { q: "她___画画。（能力）", a: ["不", "要", "会", "的"], c: 2, exp: "'会'表示有能力做某事。", tag: "语法" }
    ],
    set3: [
        { q: "正确语序：①画画 ②喜欢 ③我", a: ["①②③", "③②①", "②③①", "③①②"], c: 1, exp: "我（主）喜欢（谓）画画（宾）= ③②①。", tag: "句法" },
        { q: "'河、海、湖'共同的偏旁是？", a: ["木字旁", "三点水", "口字旁", "草字头"], c: 1, exp: "三点水（氵）都与水有关。", tag: "部首" },
        { q: "'大'字加一笔可变成？", a: ["天", "太", "火", "木"], c: 1, exp: "大字下面加一点变成'太'。", tag: "构字" },
        { q: "'床前明月光，疑是地上霜'主题是？", a: ["想吃东西", "思念家乡", "描写动物", "写春天"], c: 1, exp: "李白《静夜思》，月光引发思乡之情。", tag: "古诗" },
        { q: "描写天气的词语是？", a: ["高兴", "晴天", "美丽", "聪明"], c: 1, exp: "晴天 = sunny day，是天气词。", tag: "词汇分类" }
    ]
};

// ── Global DB (used by app.js) ────────────────────────────────
const DB = {
    math: mathDB,
    ela: elaDB,
    chinese: chineseDB
};
