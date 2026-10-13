import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import en from "./locales/en.json"
import zhCN from "./locales/zh-CN.json"

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            "zh-CN": { translation: zhCN },
        },
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
        },
    })

// Keep <html lang> matching the language the page is actually rendered in.
// Init has already finished (resources are bundled), so apply it once now,
// then follow later switches.
const syncHtmlLang = () => {
    document.documentElement.lang = i18n.resolvedLanguage ?? i18n.language
}
syncHtmlLang()
i18n.on("languageChanged", syncHtmlLang)

export default i18n