# 2026 연봉 계산 근거 및 검증 절차

Last verified: 2026-03-04 (KST)

## 공식 출처

- 국민연금 보험료율/기준소득월액  
  - https://www.nps.or.kr/jsppage/info/easy/pension_03_07.jsp
  - 반영값: 근로자 4.75%, 기준소득월액 하한 400,000원 / 상한 6,370,000원 (2025.07~2026.06)

- 건강보험료율  
  - https://www.nhis.or.kr/english/wbheaa02500m01.do
  - 반영값: 직장가입자 총 7.19%, 근로자 부담 3.595%

- 노인장기요양보험료율(건강보험료 대비)
  - https://www.mohw.go.kr/board.es?act=view&bid=0027&list_no=1487817
  - 반영값: 13.14%

- 고용보험 근로자 부담률
  - https://www.moel.go.kr/info/astmgmt/employ/employList.do
  - 반영값: 0.9%

- 소득세법(세율/세액공제/자녀세액공제)
  - https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=276127
  - 반영값: 8단계 세율, 근로소득세액공제 한도, 자녀세액공제

## 코드 매핑

- 세율/요율 상수 (Single Source of Truth): `src/data/taxRates2026.ts`
- 누진세 구간: `src/data/taxBrackets.ts`
- 4대보험·공제 집계 호환: `src/lib/tax-constants.ts`
- 근로소득 계산 로직: `src/composables/useSalaryCalc.ts`
- 종합소득세·임대소득 로직: `src/composables/useComprehensiveTaxCalc.ts`
- 임대소득 세율 규칙: `src/data/comprehensiveTaxRules.ts`

## 검증 체크리스트

1. 세율/공제/보험료 상수 변경 시 공식 출처 URL과 시행일 확인
2. 상수 변경 후 `npm run typecheck && npm run build` 실행
3. 샘플 케이스(3,000/5,000/8,000/10,000만원, 부양가족 1~4명, 비과세 0/20만원) 비교 검증
4. 운영 배포 전 변경 이력(값, 근거 URL, 시행일) 기록

## 변경 이력

### 2026-03-04 — 주택임대소득 분리과세 계산 오류 수정

**수정 파일:** `src/data/comprehensiveTaxRules.ts`, `src/composables/useComprehensiveTaxCalc.ts`

**수정 내용:**
- `RENTAL_REGISTERED_INCOME_RATE`: 0.5 → **0.4** (소득율 40% = 필요경비 60%)
- `RENTAL_UNREGISTERED_INCOME_RATE`: 0.426 → **0.5** (소득율 50% = 필요경비 50%)
- 기본공제 누락 추가: 등록 400만원, 미등록 200만원 (타종합소득 2천만원 이하 조건부)

**근거:** 국세청 주택임대소득 과세 안내 (소득세법 §64의2②)
- 등록임대: 필요경비율 60%, 기본공제 400만원
- 미등록임대: 필요경비율 50%, 기본공제 200만원
- 기본공제 적용 조건: 타종합소득금액 합계 ≤ 2,000만원

**검증:** 8개 케이스, 23개 단언 전부 통과 (`/tmp/rental_check.mjs`)

## 주의

- 본 계산기는 참고용 추정치다.
- 회사별 원천징수 방식/수당 구조/비과세 항목 적용 차이로 실수령액은 달라질 수 있다.
