// Lightweight i18n: en + lt. Strings are looked up by key; missing keys fall back
// to English so any untranslated surfaces still read sensibly.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'lt';

const STORAGE_KEY = 'roadmap.lang';

const en = {
  // Nav
  'nav.home': 'Home',
  'nav.roadmap': 'Roadmap',
  'nav.goals': 'Goals',
  'nav.growth': 'Growth',
  'nav.insights': 'Insights',
  'nav.terrarium': 'Terrarium',
  'nav.achievements': 'Achievements',
  'nav.notes': 'Notes',
  'nav.archive': 'Archive',
  'nav.settings': 'Settings',

  // Screen titles & subtitles
  'screen.roadmap.title': 'Roadmap',
  'screen.roadmap.subtitle': 'Your path to {year}.',
  'screen.goals.title': 'Goals',
  'screen.goals.subtitle': 'Plan by set and timeframe. Tap a date or use Quick add.',
  'screen.notes.title': 'Notes',
  'screen.notes.subtitle': "A scratchpad for ideas that aren't goals yet.",
  'screen.archive.title': 'Archive',
  'screen.archive.subtitle': 'Completed and archived goals — your track record.',
  'screen.settings.title': 'Settings',
  'screen.growth.title': 'Growth',
  'screen.growth.subtitle': "The scale of how far you've come.",
  'screen.insights.title': 'Insights',
  'screen.insights.subtitle': "Patterns and trends from everything you've completed.",
  'screen.terrarium.title': 'Terrarium',
  'screen.terrarium.subtitle': 'Your creatures roam free. Earn achievements to bring more to life.',

  // Common buttons & labels
  'btn.cancel': 'Cancel',
  'btn.confirm': 'Confirm',
  'btn.save': 'Save',
  'btn.delete': 'Delete',
  'btn.add': 'Add',
  'btn.close': 'Close',
  'btn.new': 'New',
  'btn.quickAdd': 'Quick add',
  'btn.newGoal': 'New goal',
  'btn.newNote': 'New note',
  'btn.newProject': 'New project',
  'btn.newSet': 'New set',
  'btn.roadmapGoal': 'Roadmap goal',
  'btn.allGoals': 'All goals',
  'btn.fullYear': 'Full year',
  'btn.reorder': 'Reorder',
  'btn.done': 'Done',
  'btn.getStarted': 'Get started',

  // Settings sections
  'settings.yourName': 'Your name',
  'settings.design': 'Design',
  'settings.designHint': "Change the whole app's look — shape, type, and feel.",
  'settings.theme': 'Theme',
  'settings.themeHint': 'Switch the whole app between dark and light styles.',
  'settings.language': 'Language',
  'settings.languageHint': 'Pick the language for the app.',
  'settings.projects': 'Projects',
  'settings.projectsHint': 'Switch projects from the sidebar. Each keeps its own goals, vision, and notes. XP and achievements are shared.',
  'settings.backup': 'Backup & restore',
  'settings.stats': 'Stats',
  'settings.startOver': 'Start over',
  'settings.startOverHint': 'Begin from a clean slate. Your name, themes, sets, and notes are always kept.',
  'settings.startFresh': 'Start fresh',
  'settings.startFreshHint': 'Clears all goals, archive, XP, level, achievements, streaks & quests.',
  'settings.resetRoadmap': 'Reset roadmap',
  'settings.resetRoadmapHint': 'Clears your long-term vision and its plan points only.',
  'settings.resetAll': 'Reset everything (incl. demo data)',

  // Roadmap
  'roadmap.mainGoal': '{year} MAIN GOAL',
  'roadmap.setYourVision': 'Set your long-term vision',
  'roadmap.editVisionHint': 'Tap the pencil to write what you’re aiming for and why.',
  'roadmap.planProgress': 'PLAN PROGRESS · {done}/{total} POINTS',
  'roadmap.overallRoadmap': 'OVERALL ROADMAP',
  'roadmap.overall': 'OVERALL',
  'roadmap.planPoints': 'PLAN POINTS',
  'roadmap.targetYear': 'TARGET YEAR',
  'roadmap.yearsLeft': 'YEARS LEFT',
  'roadmap.notes': 'Notes',
  'roadmap.notesEmpty': 'No notes yet. Tap “New” to capture an idea.',
  'roadmap.pathTo': 'Path to {year}',
  'roadmap.today': 'Today · {year}',
  'roadmap.youAreHere': 'You are here.',
  'roadmap.monthlyMilestones': 'MONTHLY MILESTONES',
  'roadmap.yearlyMilestones': 'YEARLY MILESTONES',
  'roadmap.noLongTerm': 'No long-term goals yet. Tap “Roadmap goal” above to add one.',
  'roadmap.visionAchieved': '{year} · Vision achieved',
  'roadmap.yourVision': 'Your long-term vision',
  'roadmap.allGoalsTitle': 'All roadmap goals',
  'roadmap.allGoalsHint': 'Every goal in this project, grouped by date.',
  'roadmap.noDate': 'No date',
  'roadmap.newGoalTitle': 'New roadmap goal',

  // Notes
  'notes.yourNotes': 'Your notes',
  'notes.emptyTitle': 'No notes yet',
  'notes.emptyBody': 'Tap “New note” to jot down an idea. Shape it into a goal later from the Roadmap or Goals tab.',
  'notes.untitled': 'Untitled note',
  'notes.empty': 'Empty — tap to write.',

  // Misc
  'projects.label': 'PROJECT',
  'projects.switch': 'Switch project',
  'projects.hint': 'Each project keeps its own long-term vision, goals, and notes. Your XP and achievements stay shared.',
  'projects.active': 'ACTIVE',
  'projects.noVision': 'No vision yet',
};

const lt: Partial<typeof en> = {
  'nav.home': 'Pradžia',
  'nav.roadmap': 'Kelio žemėlapis',
  'nav.goals': 'Tikslai',
  'nav.growth': 'Augimas',
  'nav.insights': 'Įžvalgos',
  'nav.terrarium': 'Terariumas',
  'nav.achievements': 'Pasiekimai',
  'nav.notes': 'Užrašai',
  'nav.archive': 'Archyvas',
  'nav.settings': 'Nustatymai',

  'screen.roadmap.title': 'Kelio žemėlapis',
  'screen.roadmap.subtitle': 'Tavo kelias iki {year} m.',
  'screen.goals.title': 'Tikslai',
  'screen.goals.subtitle': 'Planuok pagal rinkinius ir laikotarpius. Bakstelėk datą arba naudok Greitą pridėjimą.',
  'screen.notes.title': 'Užrašai',
  'screen.notes.subtitle': 'Užrašinė idėjoms, kurios dar nėra tikslai.',
  'screen.archive.title': 'Archyvas',
  'screen.archive.subtitle': 'Atlikti ir suarchyvuoti tikslai — tavo pasiekimų sąrašas.',
  'screen.settings.title': 'Nustatymai',
  'screen.growth.title': 'Augimas',
  'screen.growth.subtitle': 'Kaip toli pažengei.',
  'screen.insights.title': 'Įžvalgos',
  'screen.insights.subtitle': 'Modeliai ir tendencijos iš visko, ką atlikai.',
  'screen.terrarium.title': 'Terariumas',
  'screen.terrarium.subtitle': 'Tavo padarai laisvai vaikštinėja. Užsidirbk pasiekimus, kad atgaivintum daugiau.',

  'btn.cancel': 'Atšaukti',
  'btn.confirm': 'Patvirtinti',
  'btn.save': 'Išsaugoti',
  'btn.delete': 'Ištrinti',
  'btn.add': 'Pridėti',
  'btn.close': 'Uždaryti',
  'btn.new': 'Naujas',
  'btn.quickAdd': 'Greitai pridėti',
  'btn.newGoal': 'Naujas tikslas',
  'btn.newNote': 'Naujas užrašas',
  'btn.newProject': 'Naujas projektas',
  'btn.newSet': 'Naujas rinkinys',
  'btn.roadmapGoal': 'Žemėlapio tikslas',
  'btn.allGoals': 'Visi tikslai',
  'btn.fullYear': 'Visi metai',
  'btn.reorder': 'Pertvarkyti',
  'btn.done': 'Atlikta',
  'btn.getStarted': 'Pradėkime',

  'settings.yourName': 'Tavo vardas',
  'settings.design': 'Dizainas',
  'settings.designHint': 'Pakeisk viso programos vaizdą — formą, tipografiją, jauseną.',
  'settings.theme': 'Tema',
  'settings.themeHint': 'Pasirink šviesų ar tamsų stilių.',
  'settings.language': 'Kalba',
  'settings.languageHint': 'Pasirink programos kalbą.',
  'settings.projects': 'Projektai',
  'settings.projectsHint': 'Projektus keisk per šoninę juostą. Kiekvienas turi savo tikslus, viziją ir užrašus. XP ir pasiekimai bendri.',
  'settings.backup': 'Atsarginė kopija',
  'settings.stats': 'Statistika',
  'settings.startOver': 'Pradėti iš naujo',
  'settings.startOverHint': 'Pradėk nuo švaraus lapo. Tavo vardas, temos, rinkiniai ir užrašai išlieka.',
  'settings.startFresh': 'Švarus startas',
  'settings.startFreshHint': 'Išvalo visus tikslus, archyvą, XP, lygį, pasiekimus, sekas ir užduotis.',
  'settings.resetRoadmap': 'Atstatyti žemėlapį',
  'settings.resetRoadmapHint': 'Išvalo tik ilgalaikę viziją ir jos planą.',
  'settings.resetAll': 'Atstatyti viską (su demonstraciniais duomenimis)',

  'roadmap.mainGoal': '{year} M. PAGRINDINIS TIKSLAS',
  'roadmap.setYourVision': 'Įvardink ilgalaikę viziją',
  'roadmap.editVisionHint': 'Bakstelėk pieštuką ir užsirašyk, ko sieki ir kodėl.',
  'roadmap.planProgress': 'PLANO PAŽANGA · {done}/{total} TAŠKŲ',
  'roadmap.overallRoadmap': 'BENDRA PAŽANGA',
  'roadmap.overall': 'BENDRA',
  'roadmap.planPoints': 'PLANO TAŠKAI',
  'roadmap.targetYear': 'TIKSLINIAI METAI',
  'roadmap.yearsLeft': 'METŲ LIKO',
  'roadmap.notes': 'Užrašai',
  'roadmap.notesEmpty': 'Užrašų dar nėra. Bakstelėk „Naujas“ ir užfiksuok idėją.',
  'roadmap.pathTo': 'Kelias iki {year} m.',
  'roadmap.today': 'Šiandien · {year} m.',
  'roadmap.youAreHere': 'Esi čia.',
  'roadmap.monthlyMilestones': 'MĖNESINĖS GAIRĖS',
  'roadmap.yearlyMilestones': 'METINĖS GAIRĖS',
  'roadmap.noLongTerm': 'Ilgalaikių tikslų dar nėra. Bakstelėk „Žemėlapio tikslas“, kad pridėtum.',
  'roadmap.visionAchieved': '{year} · Vizija pasiekta',
  'roadmap.yourVision': 'Tavo ilgalaikė vizija',
  'roadmap.allGoalsTitle': 'Visi žemėlapio tikslai',
  'roadmap.allGoalsHint': 'Visi šio projekto tikslai, sugrupuoti pagal datą.',
  'roadmap.noDate': 'Be datos',
  'roadmap.newGoalTitle': 'Naujas žemėlapio tikslas',

  'notes.yourNotes': 'Tavo užrašai',
  'notes.emptyTitle': 'Užrašų dar nėra',
  'notes.emptyBody': 'Bakstelėk „Naujas užrašas“ ir užfiksuok idėją. Vėliau gali ją paversti tikslu Žemėlapio arba Tikslų skirtuke.',
  'notes.untitled': 'Be pavadinimo',
  'notes.empty': 'Tuščia — bakstelėk ir rašyk.',

  'projects.label': 'PROJEKTAS',
  'projects.switch': 'Keisti projektą',
  'projects.hint': 'Kiekvienas projektas turi savo ilgalaikę viziją, tikslus ir užrašus. XP ir pasiekimai išlieka bendri.',
  'projects.active': 'AKTYVUS',
  'projects.noVision': 'Vizijos dar nėra',
};

const TABLES: Record<Lang, Partial<typeof en>> = { en, lt };

export type Key = keyof typeof en;

function format(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

// React context for the active language so consumers re-render on switch.
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: Key, vars?: Record<string, string | number>) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'lt' || saved === 'en') setLangState(saved);
    });
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  };

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => format((TABLES[lang][key] as string | undefined) ?? en[key] ?? String(key), vars),
    }),
    [lang],
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

// Convenience: just the t() function.
export function useT() {
  return useI18n().t;
}
