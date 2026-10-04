// ============================================================
// The Trading Paper — Company profiles (window.TP_COMPANIES)
// One place for the short company description shown on the
// Dividend Book (dividends.html). Numbers (shares, value, yield)
// are NOT stored here — they come from js/portfolios.data.js and
// js/dividends.data.js. Add a ticker here when a new holding is bought.
// ============================================================
(function () {
  'use strict';
  window.TP_COMPANIES = {
    VOO:  { icon: '🏛️', sector: 'S&P 500 ინდექსის ETF',     desc: 'აშშ-ის 500 უმსხვილესი კორპორაცია ერთ ქაღალდში · საბაზრო საძირკველი' },
    MAIN: { icon: '🏢', sector: 'BDC · კერძო კრედიტი',        desc: 'ამერიკის საშუალო ბიზნესის დაკრედიტება · ყოველთვიური + კვარტალური დამატებითი დივიდენდი' },
    BXSL: { icon: '🛡️', sector: 'უზრუნველყოფილი სესხები',     desc: 'Blackstone-ის პირველი რიგის უზრუნველყოფილი სესხები საშუალო კომპანიებზე' },
    LYG:  { icon: '🏦', sector: 'ბრიტანული ბანკი',            desc: 'დიდი ბრიტანეთის უმსხვილესი საცალო ბანკი · Deep Value' },
    KO:   { icon: '🥤', sector: 'სამომხმარებლო ბრენდი',       desc: 'Coca-Cola · 60+ წელი უწყვეტად მზარდი დივიდენდი (Dividend King)' },
    O:    { icon: '🏬', sector: 'კომერციული REIT',            desc: 'The Monthly Dividend Company · 15,000+ კომერციული ობიექტის იჯარა' },
    DIVO: { icon: '📈', sector: 'Covered Call ETF',           desc: 'დივიდენდური „ლურჯი ჩიპები“ + ტაქტიკური დაფარული ოფციონები' },
    QQQI: { icon: '⚡', sector: 'Nasdaq-100 შემოსავალი',       desc: 'Nasdaq-100-ის ზრდა + ყოველთვიური ოფციონური ფულადი ნაკადი' },
    ARCC: { icon: '💼', sector: 'BDC · პირდაპირი დაკრედიტება', desc: 'აშშ-ის უდიდესი საჯარო BDC · ფართოდ დივერსიფიცირებული სესხების პორტფელი' },
    MRVL: { icon: '🔬', sector: 'AI ოპტიკა & ჩიპები',          desc: 'AI მონაცემთა ცენტრების ოპტიკური ჩიპები და ASIC პროცესორები' },
    SNDK: { icon: '💾', sector: 'NAND & Flash მეხსიერება',     desc: 'Enterprise SSD დისკები და ფლეშ-მეხსიერება' },
    VRT:  { icon: '❄️', sector: 'გაგრილების სისტემები',        desc: 'AI სერვერების თხევადი გაგრილება და ელექტრო ინფრასტრუქტურა' },
    BE:   { icon: '🔋', sector: 'სუფთა ენერგია · SOFC',        desc: 'ადგილზე ელექტროენერგიის გენერაცია მონაცემთა ცენტრებისთვის' }
  };
})();
