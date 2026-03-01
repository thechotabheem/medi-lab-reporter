import { supabase } from '@/integrations/supabase/client';
import type { ReportType } from '@/types/database';

/**
 * Get short code for a report type.
 * E.g. 'cbc' -> 'CBC', 'lipid_profile' -> 'LP', 'combined' -> 'CMB'
 */
const REPORT_TYPE_CODES: Record<string, string> = {
  cbc: 'CBC',
  lft: 'LFT',
  rft: 'RFT',
  lipid_profile: 'LP',
  esr: 'ESR',
  bsr: 'BSR',
  bsf: 'BSF',
  serum_calcium: 'SCA',
  mp: 'MP',
  typhoid: 'TYP',
  hcv: 'HCV',
  hbsag: 'HBS',
  hiv: 'HIV',
  vdrl: 'VDR',
  h_pylori: 'HPY',
  blood_group: 'BG',
  ra_factor: 'RAF',
  combined: 'CMB',
  blood_test: 'BLT',
  urine_analysis: 'URN',
  hormone_immunology: 'HIM',
  microbiology: 'MCB',
  ultrasound: 'ULS',
  screening_tests: 'SCR',
  blood_group_typing: 'BGT',
};

export function getReportTypeCode(reportType: string): string {
  return REPORT_TYPE_CODES[reportType] || reportType.slice(0, 3).toUpperCase();
}

/**
 * Generate sequential patient ID: PT-YY-0001
 */
export async function generatePatientId(clinicId: string): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2); // "26"
  const prefix = `PT-${year}-`;

  const { data } = await supabase
    .from('patients')
    .select('patient_id_number')
    .eq('clinic_id', clinicId)
    .like('patient_id_number', `${prefix}%`)
    .order('patient_id_number', { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0 && data[0].patient_id_number) {
    const lastNum = parseInt(data[0].patient_id_number.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
}

/**
 * Generate sequential report number: CBC-MM-001
 */
export async function generateReportNumber(reportType: string, clinicId: string): Promise<string> {
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0'); // "02"
  const code = getReportTypeCode(reportType);
  const prefix = `${code}-${month}-`;

  const { data } = await supabase
    .from('reports')
    .select('report_number')
    .eq('clinic_id', clinicId)
    .like('report_number', `${prefix}%`)
    .order('report_number', { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const lastNum = parseInt(data[0].report_number.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${nextNum.toString().padStart(3, '0')}`;
}
