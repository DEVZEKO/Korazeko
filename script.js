const ESPN_API = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

const TEAMS = {
  home: ["egypt", "مصر", "egy"],
  away: ["argentina", "الأرجنتين", "arg"],
};

const els = {
  homeName: document.getElementById("homeName"),
  awayName: document.getElementById("awayName"),
  homeScore: document.getElementById("homeScore"),
  awayScore: document.getElementById("awayScore"),
  matchStatus: document.getElementById("matchStatus"),
  matchTime: document.getElementById("matchTime"),
  eventsList: document.getElementById("eventsList"),
  lastUpdate: document.getElementById("lastUpdate"),
  refreshBtn: document.getElementById("refreshBtn"),
};

function normalize(value = "") {
  return String(value).toLowerCase().trim();
}

function teamMatches(team, words) {
  const haystack = [team?.team?.displayName, team?.team?.shortDisplayName, team?.team?.name, team?.team?.abbreviation]
    .map(normalize)
    .join(" ");
  return words.some((word) => haystack.includes(normalize(word)));
}

function findEgyptArgentina(events = []) {
  return events.find((event) => {
    const competitors = event?.competitions?.[0]?.competitors || [];
    const hasEgypt = competitors.some((team) => teamMatches(team, TEAMS.home));
    const hasArgentina = competitors.some((team) => teamMatches(team, TEAMS.away));
    return hasEgypt && hasArgentina;
  });
}

function formatDate(dateText) {
  if (!dateText) return "الوقت غير متاح";
  try {
    return new Date(dateText).toLocaleString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateText;
  }
}

function renderFallback() {
  els.homeScore.textContent = "0";
  els.awayScore.textContent = "0";
  els.matchStatus.textContent = "الـ API يعمل، لكن مباراة مصر والأرجنتين غير ظاهرة حاليًا في جدول ESPN.";
  els.matchTime.textContent = "سيتم التحديث تلقائيًا عند ظهور المباراة في مصدر النتائج.";
  els.eventsList.innerHTML = `
    <li>📡 تم تركيب API بدون مفتاح.</li>
    <li>✅ الصفحة تعمل حتى لو المباراة غير موجودة في الجدول الحالي.</li>
    <li>🔄 الموقع يحدث النتيجة كل 60 ثانية.</li>
  `;
  els.lastUpdate.textContent = new Date().toLocaleString("ar-EG");
}

function renderMatch(event) {
  const competition = event.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  const egypt = competitors.find((team) => teamMatches(team, TEAMS.home));
  const argentina = competitors.find((team) => teamMatches(team, TEAMS.away));
  const status = event.status?.type || {};

  els.homeName.textContent = egypt?.team?.shortDisplayName || "مصر";
  els.awayName.textContent = argentina?.team?.shortDisplayName || "الأرجنتين";
  els.homeScore.textContent = egypt?.score ?? "0";
  els.awayScore.textContent = argentina?.score ?? "0";
  els.matchStatus.textContent = status.description || status.detail || "حالة المباراة غير متاحة";
  els.matchTime.textContent = formatDate(event.date);
  els.lastUpdate.textContent = new Date().toLocaleString("ar-EG");

  const details = [
    `🏟️ البطولة: ${event.league?.name || "كأس العالم / FIFA"}`,
    `⏱️ الحالة: ${status.shortDetail || status.detail || "غير متاح"}`,
    `📅 الموعد: ${formatDate(event.date)}`,
  ];

  if (competition.venue?.fullName) details.push(`📍 الملعب: ${competition.venue.fullName}`);
  if (event.links?.[0]?.href) details.push(`🔗 يوجد رابط تفاصيل رسمي من مصدر النتائج.`);

  els.eventsList.innerHTML = details.map((item) => `<li>${item}</li>`).join("");
}

async function fetchMatch() {
  els.matchStatus.textContent = "جاري تحديث النتيجة...";
  try {
    const res = await fetch(ESPN_API, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const match = findEgyptArgentina(data.events || []);
    if (!match) return renderFallback();
    renderMatch(match);
  } catch (error) {
    els.matchStatus.textContent = "تعذر الوصول للـ API الآن، لكن الموقع شغال والبث موجود.";
    els.matchTime.textContent = "جرّب تحديث الصفحة أو ارفع الموقع على Vercel/Netlify.";
    els.eventsList.innerHTML = `
      <li>⚠️ حصل خطأ اتصال بمصدر النتائج.</li>
      <li>سبب محتمل: ضعف إنترنت، حظر CORS مؤقت، أو مصدر النتائج غير متاح.</li>
      <li>الكود جاهز ومركّب على API بدون مفتاح.</li>
    `;
    els.lastUpdate.textContent = new Date().toLocaleString("ar-EG");
    console.error(error);
  }
}

els.refreshBtn.addEventListener("click", fetchMatch);
fetchMatch();
setInterval(fetchMatch, 60000);
