import type { Lang } from './useLanguage'

type Translations = {
  // Tab bar
  home: string
  my: string
  schedule: string
  map: string
  goods: string
  profile: string
  // Common
  cancel: string
  save: string
  add: string
  delete: string
  confirm: string
  // Home
  todoTitle: string
  todoPlaceholder: string
  todoDoneHide: string
  todoDoneShow: string
  todoEmpty: string
  newSchedule: string
  upcomingEvents: string
  // Schedule
  regionAll: string
  regionJP: string
  regionKR: string
  regionOverseas: string
  noEvents: string
  // Profile
  signOut: string
  signOutConfirm: string
  language: string
  theme: string
  notifications: string
  // Login
  loginTitle: string
  loginSubtitle: string
  loginEmail: string
  loginPassword: string
  loginButton: string
  loginGoogle: string
  loginOr: string
  loginNoAccount: string
  loginGuestNote: string
}

const ja: Translations = {
  home: 'HOME', my: 'MY', schedule: 'SCHEDULE', map: 'MAP', goods: 'GOODS', profile: 'PROFILE',
  cancel: 'キャンセル', save: '保存', add: '追加', delete: '削除', confirm: '確認',
  todoTitle: 'TODO', todoPlaceholder: 'TODOを追加...', todoDoneHide: '完了を隠す',
  todoDoneShow: '完了', todoEmpty: 'やることを追加しよう',
  newSchedule: '新着スケジュール', upcomingEvents: 'UPCOMING',
  regionAll: '全地域', regionJP: '日本', regionKR: '韓国', regionOverseas: '海外',
  noEvents: 'この日のスケジュールはありません',
  signOut: 'サインアウト', signOutConfirm: 'サインアウト確認',
  language: '言語', theme: 'テーマ', notifications: '通知',
  loginTitle: 'Connects+', loginSubtitle: 'SVTファンのためのアプリ',
  loginEmail: 'メールアドレス', loginPassword: 'パスワード',
  loginButton: 'ログイン', loginGoogle: 'Googleでログイン',
  loginOr: 'または', loginNoAccount: 'アカウントをお持ちでない方は',
  loginGuestNote: 'ゲストとして続ける',
}

const en: Translations = {
  home: 'HOME', my: 'MY', schedule: 'SCHEDULE', map: 'MAP', goods: 'GOODS', profile: 'PROFILE',
  cancel: 'Cancel', save: 'Save', add: 'Add', delete: 'Delete', confirm: 'Confirm',
  todoTitle: 'TODO', todoPlaceholder: 'Add a todo...', todoDoneHide: 'Hide done',
  todoDoneShow: 'Done', todoEmpty: 'Nothing to do yet!',
  newSchedule: 'New Schedules', upcomingEvents: 'UPCOMING',
  regionAll: 'All', regionJP: 'Japan', regionKR: 'Korea', regionOverseas: 'Overseas',
  noEvents: 'No events on this day',
  signOut: 'Sign out', signOutConfirm: 'Confirm sign out',
  language: 'Language', theme: 'Theme', notifications: 'Notifications',
  loginTitle: 'Connects+', loginSubtitle: 'The app for SVT fans',
  loginEmail: 'Email', loginPassword: 'Password',
  loginButton: 'Log in', loginGoogle: 'Continue with Google',
  loginOr: 'or', loginNoAccount: "Don't have an account?",
  loginGuestNote: 'Continue as guest',
}

const ko: Translations = {
  home: 'HOME', my: 'MY', schedule: 'SCHEDULE', map: 'MAP', goods: 'GOODS', profile: 'PROFILE',
  cancel: '취소', save: '저장', add: '추가', delete: '삭제', confirm: '확인',
  todoTitle: 'TODO', todoPlaceholder: 'TODO 추가...', todoDoneHide: '완료 숨기기',
  todoDoneShow: '완료', todoEmpty: '할 일을 추가해 보세요',
  newSchedule: '새 스케줄', upcomingEvents: 'UPCOMING',
  regionAll: '전체', regionJP: '일본', regionKR: '한국', regionOverseas: '해외',
  noEvents: '이 날의 스케줄이 없습니다',
  signOut: '로그아웃', signOutConfirm: '로그아웃 확인',
  language: '언어', theme: '테마', notifications: '알림',
  loginTitle: 'Connects+', loginSubtitle: 'SVT 팬을 위한 앱',
  loginEmail: '이메일', loginPassword: '비밀번호',
  loginButton: '로그인', loginGoogle: 'Google로 로그인',
  loginOr: '또는', loginNoAccount: '계정이 없으신가요?',
  loginGuestNote: '게스트로 계속하기',
}

const translations: Record<Lang, Translations> = { ja, en, ko }

export function t(lang: Lang, key: keyof Translations): string {
  return translations[lang][key]
}

export const LANG_LABELS: Record<Lang, string> = {
  ja: '日本語',
  en: 'English',
  ko: '한국어',
}
