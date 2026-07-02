/**
 * @helm/domain — pure, framework-free EPM domain logic shared across the API,
 * jobs and reports. Currently: the KPI evaluation core. Additional bounded
 * contexts (risk scoring, portfolio prioritization) land here as they ship.
 */
export * from './kpi/kpi.logic';
