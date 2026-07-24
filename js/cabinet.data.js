// ============================================================
// The Trading Paper — Cabinet subpages data
// (ჩემი კაბინეტი → მიზნები / ჩემი ჩანაწერები)
// SINGLE SOURCE OF TRUTH for these pages.
// To add or change entries: edit the arrays below and commit.
// (The pages also have an "add" form that builds the new file
//  content for you to paste back here.)
// Watchlist removed — see change spec §9.
// ============================================================
window.CABINET = {
  goals: [],
  notes: [],

  // ---- ანგარიშები · Reports Archive ------------------------
  reports: [
    { id: 'seed-16', title: 'გამოცემა №16', date: '2026-07-24', desc: 'BOG-ის 32 სკალპინგ ტრანზაქცია ($819.26 მოცულობა) და პორტფელის SNDK/SSRM-ზე გადაწყობა.', pdf: 'pdfs/thetradingpaper16.pdf', permanent: true },
    { id: 'seed-15', title: 'გამოცემა №15', date: '2026-07-24', desc: 'BOG-ის 23 ივლისის სკალპინგი (MSTR/SNDK/HIMS) და ინფო გვერდების აღდგენა.', pdf: 'pdfs/thetradingpaper15.pdf', permanent: true },
    { id: 'seed-14', title: 'გამოცემა №14', date: '2026-07-14', desc: 'BOG-ის proceeds შესყიდვები და TBC დივიდენდების დაგეგმვა.', pdf: 'pdfs/thetradingpaper14.pdf', permanent: true },
    { id: 'seed-13', title: 'გამოცემა №13', date: '2026-06-29', desc: 'პორტფელის სტრატეგიული რეორგანიზაცია და კორექტირებები.', pdf: 'pdfs/thetradingpaper13.pdf', permanent: true },
    { id: 'seed-12', title: 'გამოცემა №12', date: '2026-06-25', desc: 'სექტორული ანალიზი და რისკების მართვის დანერგვა.', pdf: 'pdfs/thetradingpaper12.pdf', permanent: true },
    { id: 'seed-11', title: 'გამოცემა №11', date: '2026-06-25', desc: 'აქტიური ვაჭრობის შედეგები და GALT-ის განხილვა.', pdf: 'pdfs/thetradingpaper11.pdf', permanent: true },
    { id: 'seed-10', title: 'გამოცემა №10', date: '2026-06-15', desc: 'საპროცენტო განაკვეთები და დივიდენდური სტრატეგიები.', pdf: 'pdfs/thetradingpaper10.pdf', permanent: true },
    { id: 'seed-9',  title: 'გამოცემა №9',  date: '2026-06-12', desc: 'ტექნოლოგიური სექტორის აქტივობა და AI-ის ტრენდები.', pdf: 'pdfs/thetradingpaper9.pdf', permanent: true },
    { id: 'seed-8',  title: 'გამოცემა №8',  date: '2026-06-11', desc: 'პირველი კვარტლის შეჯამება და ბაზრის მოლოდინები.', pdf: 'pdfs/thetradingpaper8.pdf', permanent: true },
    { id: 'seed-7',  title: 'გამოცემა №7',  date: '2026-05-29', desc: 'TBC პორტფელის გახსნა და პირველი შესყიდვები.', pdf: 'pdfs/thetradingpaper7.pdf', permanent: true },
    { id: 'seed-6',  title: 'გამოცემა №6',  date: '2026-05-27', desc: 'საფონდო ბირჟის ზოგადი მიმოხილვა და DCA ლოგიკა.', pdf: 'pdfs/thetradingpaper6.pdf', permanent: true },
    { id: 'seed-5',  title: 'გამოცემა №5',  date: '2026-05-22', desc: 'BOG პორტფელის ეტაპობრივი ზრდის ანალიტიკა.', pdf: 'pdfs/thetradingpaper5.pdf', permanent: true },
    { id: 'seed-4',  title: 'გამოცემა №4',  date: '2026-05-21', desc: 'პოზიციების გადანაწილება და ბერკეტის რისკები.', pdf: 'pdfs/thetradingpaper4.pdf', permanent: true },
    { id: 'seed-3',  title: 'გამოცემა №3',  date: '2026-05-11', desc: 'MSTR CFD ვაჭრობის დეტალური განხილვა.', pdf: 'pdfs/thetradingpaper3.pdf', permanent: true },
    { id: 'seed-2',  title: 'გამოცემა №2',  date: '2026-05-09', desc: 'პირველი საინვესტიციო ნაბიჯები და მიზნების დასახვა.', pdf: 'pdfs/thetradingpaper2.pdf', permanent: true },
    { id: 'seed-1',  title: 'გამოცემა №1 (Anchor)', date: '2026-01-01', desc: 'საწყისი კაპიტალის დაგროვება და The Trading Paper-ის დაარსება.', pdf: 'pdfs/thetradingpaper1.pdf', permanent: true }
  ]

};
