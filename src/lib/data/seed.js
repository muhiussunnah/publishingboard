// Demo seed data — ported from the client sample (famies-publiceringsbord_2.html)
// with canonical enum keys. Dates are relative to "today" so the board always
// looks current on first run.

function buildSeed() {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const add = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };
  const iso = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString(); };

  const customers = [
    { id: 'cust1', name: 'Pizzeria Berga', contact: 'Marco · 070-123 45 67', type: 'lokal', owner: 'Albin', value: 10600, package: 'standard', mailboxCount: 12, videoCount: 2, city: 'Österåker', link: 'https://pizzeriaberga.se', startDate: add(-30), note: 'Stängd 12 april — Albin' },
    { id: 'cust2', name: 'Umami Sushi Täby', contact: 'Hiro · hiro@umamitaby.se', type: 'lokal', owner: 'Albin', value: 10600, package: 'standard', mailboxCount: 12, videoCount: 0, city: 'Täby', link: 'https://umamitaby.se', startDate: add(-20), note: 'Stängd 14 april' },
    { id: 'cust3', name: 'Väsby Färghall', contact: 'Sanna · 070-987 65 43', type: 'lokal', owner: 'Albin', value: 10600, package: 'standard', mailboxCount: 12, videoCount: 1, city: 'Upplands Väsby', link: 'https://vasbyfarg.se', startDate: add(-25), note: '' },
    { id: 'cust4', name: 'ICA Maxi Häggvik', contact: 'Lina · lina@icamaxi.se', type: 'stor', owner: 'Albin', value: 24000, package: 'storkund', mailboxCount: 24, videoCount: 4, city: 'Sollentuna', link: 'https://icamaxi.se/haggvik', startDate: add(-10), note: 'Storkund — 2 notiser/mån' },
    { id: 'cust5', name: 'Semon Sushi', contact: 'Aki', type: 'lokal', owner: 'Albin', value: 10600, package: 'standard', mailboxCount: 12, videoCount: 0, city: 'Österåker', link: 'https://semon.se', startDate: add(-15), note: '' },
  ];

  const items = [
    { id: 'i1', type: 'brevlada', customerId: 'cust1', title: 'Baka pizza med familjen', description: 'Familjeworkshop varje lördag — boka nu', link: 'https://pizzeriaberga.se', city: 'Österåker', to: 'Österåker + Vaxholm', ageAll: true, starts: add(-2), ends: add(28), status: 'publicerad', note: 'Första notisen i månaden' },
    { id: 'i2', type: 'brevlada', customerId: 'cust2', title: 'Sommarmenyn är här', description: 'Färska bowls efter knattefotbollen', link: 'https://umamitaby.se', city: 'Täby', to: 'Täby + Danderyd', ageAll: true, starts: add(0), ends: add(30), status: 'godkand', note: 'Albin godkänt 19 maj' },
    { id: 'i3', type: 'brevlada', customerId: 'cust3', title: 'Måla om barnrummet', description: 'Rabatt på barnsäkra färger — hela maj', link: 'https://vasbyfarg.se', city: 'Upplands Väsby', to: 'Stockholm Nord', ageFrom: 3, ageTo: 8, starts: add(1), ends: add(14), status: 'vantar', note: 'Skickat till Albin för godkännande' },
    { id: 'i4', type: 'brevlada', customerId: 'cust4', title: 'Sommarens grilltrend', description: 'Allt för familjegrillen — fynda i butik', link: 'https://icamaxi.se', city: 'Sollentuna', to: 'Sollentuna + Upplands Väsby', ageAll: true, starts: add(-3), ends: add(10), status: 'godkand', note: 'OBS — försenad. Skicka till Injamul.' },
    { id: 'i5', type: 'video', customerId: 'cust1', title: 'Pizzeria Berga — familjekväll', caption: 'Lördagar är familjekvällar 🍕', videoUrl: 'https://drive.google.com/file/d/pizzeria-berga', link: 'https://pizzeriaberga.se', city: 'Österåker', to: 'Österåker', ageAll: true, starts: add(5), ends: add(12), status: 'utkast', note: 'Tayyab levererar 22 maj' },
    { id: 'i6', type: 'video', customerId: 'cust4', title: 'ICA Maxi sommargrill', caption: 'Klart för helggrillen?', videoUrl: '', link: 'https://icamaxi.se', city: 'Sollentuna', to: 'Sollentuna', ageAll: true, starts: add(7), ends: add(20), status: 'utkast', note: 'Väntar på material från kund' },
    { id: 'i7', type: 'event', customerId: 'cust1', title: 'Pizzaworkshop för familjer', description: 'Kom och rulla din egen pizza! Vi har deg, sås och allt du behöver. För hela familjen — perfekt lördagsaktivitet.', arrangor: 'Pizzeria Berga', address: 'Storgatan 12, Åkersberga', link: 'https://pizzeriaberga.se/event/workshop', city: 'Österåker', to: 'Österåker + Vaxholm', ageFrom: 3, ageTo: null, starts: add(5), ends: add(5), status: 'godkand', note: 'Återkommande varje lördag', image: null },
    { id: 'i8', type: 'event', customerId: 'cust4', title: 'Sommarkickoff på ICA Maxi', description: 'Smakprov, tävlingar för barnen och rabatter på alla grillvaror. Pop-up glasskiosk utanför butiken.', arrangor: 'ICA Maxi Häggvik', address: 'Häggvikshallen 7, Sollentuna', link: 'https://icamaxi.se/event/sommarkickoff', city: 'Sollentuna', to: 'Sollentuna + Upplands Väsby + Täby', ageAll: true, starts: add(12), ends: add(12), status: 'vantar', note: 'Skickat till Albin 19 maj', image: null },
  ];

  const videos = [
    { id: 'v1', number: 'V-001', name: 'Knattefotboll Hellasgården', category: 'plats', description: 'Söndagsmys vid fotbollsplanen. Familjeaktivitet, lätt-igenkännlig.', link: 'https://drive.google.com/file/d/v001-knattefotboll', producer: 'Tayyab', date: add(-14), note: 'Evergreen — kan användas hela året' },
    { id: 'v2', number: 'V-002', name: 'Pizzeria Berga familjekväll', category: 'kund', description: 'Pizza-rullning för barn, händer och deg. Kund: Pizzeria Berga.', link: 'https://drive.google.com/file/d/v002-pizzeria', producer: 'Tayyab', date: add(-10), note: 'Tidlös — kunden återanvänder den varje månad' },
    { id: 'v3', number: 'V-003', name: 'Veckans fråga — sommarplaner', category: 'fraga', description: 'Hook: "Vad ska era barn göra i sommar?" CTA: Fråga i Famies.', link: 'https://drive.google.com/file/d/v003-sommarfraga', producer: 'Tayyab', date: add(-7), note: 'För maj månads veckans-fråga' },
    { id: 'v4', number: 'V-004', name: 'Tipsa-video — bästa lekplatsen', category: 'tipsa', description: 'Uppmuntrar föräldrar att dela tips om lekplatser.', link: 'https://drive.google.com/file/d/v004-lekplats', producer: 'Tayyab', date: add(-5), note: '' },
    { id: 'v5', number: 'V-005', name: 'SOME Chaos and Love', category: 'some', description: 'Generisk SOME-post för Instagram. Familje-perspektiv.', link: 'https://drive.google.com/file/d/v005-some', producer: 'Tayyab', date: add(-3), note: 'Skickat till Tåve för godkännande' },
  ];

  const leads = [
    { id: 'l1', company: 'Restaurang Pont', contact: 'Sara Lundgren', phone: '070-456 78 90', city: 'Täby', owner: 'Ezra', stage: 'mote', value: 10600, type: 'lokal', source: 'Canvas Täby Centrum', note: 'Vill ha demo onsdag 14:00', dialog: [ { date: iso(-1), text: 'Bokat möte onsdag 14:00 på plats', by: 'Ezra' }, { date: iso(-3), text: 'Canvas — intresserad, vill träffa Albin', by: 'Ezra' } ], createdAt: iso(-3) },
    { id: 'l2', company: 'Coop Häggvik', contact: 'Linda Eriksson', phone: 'linda.eriksson@coop.se', city: 'Sollentuna', owner: 'Albin', stage: 'offert', value: 24000, type: 'stor', source: 'Inkommande mail efter pressartikel', note: 'Vill ha samma upplägg som ICA Maxi', dialog: [ { date: iso(-2), text: 'Offert skickad — 24 notiser/år, 24 000 kr', by: 'Albin' }, { date: iso(-5), text: 'Demo genomförd, gillar plattformen', by: 'Albin' }, { date: iso(-8), text: 'Första kontakt — vill veta mer', by: 'Albin' } ], createdAt: iso(-8) },
    { id: 'l3', company: 'FlipOut Täby', contact: 'Marcus', phone: '073-111 22 33', city: 'Täby', owner: 'Samuel', stage: 'kontaktad', value: 10600, type: 'aktivitet', source: 'LinkedIn-mejl', note: 'Trampolinpark — perfekt målgrupp', dialog: [ { date: iso(-4), text: 'Skickat mejl med pitch + demo-video', by: 'Samuel' } ], createdAt: iso(-4) },
    { id: 'l4', company: 'Stockholms Naturskola', contact: 'Anna Berg', phone: '070-555 12 34', city: 'Solna', owner: 'Tåve', stage: 'ny', value: 10600, type: 'aktivitet', source: 'Referens från seed-grupp', note: 'Tåve har personlig kontakt', dialog: [], createdAt: iso(0) },
    { id: 'l5', company: 'Lidingö Simhall', contact: 'Peter Holm', phone: '070-789 01 23', city: 'Lidingö', owner: 'Ezra', stage: 'pausad', value: 10600, type: 'aktivitet', source: 'Canvas', note: 'Pausade — vill återkomma efter sommarstängningen', dialog: [ { date: iso(-21), text: 'Pausat — säsongstängning, hör av sig i augusti', by: 'Ezra' }, { date: iso(-25), text: 'Möte — för tidigt, inte budget i år', by: 'Ezra' } ], createdAt: iso(-25) },
    { id: 'l6', company: 'Picadeli Sollentuna', contact: 'Erik', phone: 'erik@picadeli.se', city: 'Sollentuna', owner: 'Ilja', stage: 'forlorad', value: 10600, type: 'lokal', source: 'Cold call', note: 'För liten budget', dialog: [ { date: iso(-18), text: 'Tackade nej — för liten budget i år', by: 'Ilja' }, { date: iso(-22), text: 'Demo genomförd', by: 'Ilja' } ], createdAt: iso(-22) },
    { id: 'l7', company: 'Yogashala Vallentuna', contact: 'Mia', phone: '070-987 54 32', city: 'Vallentuna', owner: 'Ezra', stage: 'kontaktad', value: 5300, type: 'lokal', source: 'Canvas Vallentuna', note: 'Familjeyoga — relevant målgrupp', dialog: [ { date: iso(-6), text: 'Bra första samtal, vill se appen', by: 'Ezra' } ], createdAt: iso(-6) },
  ];

  const salespeople = ['Albin', 'Ezra', 'Samuel', 'Tåve', 'Ilja', 'Injamul', 'Tayyab'];
  const customerTypes = ['lokal', 'stor', 'aktivitet', 'kommun', 'upplevelse'];

  return { customers, items, videos, leads, salespeople, customerTypes };
}

export default buildSeed;
