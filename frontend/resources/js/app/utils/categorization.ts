// AI-powered keyword-based categorization and urgency detection

export type CounselingCategory =
  | 'depression'
  | 'anxiety'
  | 'ptsd'
  | 'addiction'
  | 'relationship'
  | 'academic_stress'
  | 'grief'
  | 'self_harm'
  | 'suicide'
  | 'eating_disorder'
  | 'general';

export type CaseCategory =
  | 'financial_aid'
  | 'sexual_harassment_gbv'
  | 'sexual_harassment'
  | 'gbv'
  | 'sexual_assault'
  | 'physical_assault'
  | 'stalking'
  | 'cyberbullying'
  | 'academic_misconduct'
  | 'discrimination'
  | 'health_services'
  | 'housing'
  | 'substance_abuse'
  | 'mental_health'
  | 'relationship_violence'
  | 'general';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical' | 'immediate';

// Keyword patterns for counseling categorization
const counselingKeywords: Record<CounselingCategory, string[]> = {
  suicide: [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
    'life not worth', 'better off dead', 'no reason to live'
  ],
  self_harm: [
    'self harm', 'self-harm', 'cutting', 'hurt myself', 'self injury',
    'self-injury', 'burning myself', 'harming myself'
  ],
  depression: [
    'depressed', 'depression', 'hopeless', 'worthless', 'empty',
    'sad all the time', 'no energy', 'cant get out of bed', 'lost interest'
  ],
  anxiety: [
    'anxiety', 'anxious', 'panic attack', 'panic', 'worry constantly',
    'cant stop worrying', 'nervous', 'fear', 'phobia', 'scared'
  ],
  ptsd: [
    'ptsd', 'trauma', 'traumatic', 'flashback', 'nightmare',
    'cant sleep', 'hypervigilant', 'triggered', 'assault', 'abuse'
  ],
  addiction: [
    'addiction', 'addicted', 'substance abuse', 'alcohol', 'drinking problem',
    'drug', 'cant stop', 'dependency', 'gambling', 'gaming addiction'
  ],
  eating_disorder: [
    'eating disorder', 'anorexia', 'bulimia', 'binge eating',
    'purging', 'food obsession', 'body image', 'weight obsession'
  ],
  grief: [
    'grief', 'grieving', 'loss', 'died', 'death', 'mourning',
    'bereavement', 'passed away', 'funeral'
  ],
  relationship: [
    'relationship', 'breakup', 'divorce', 'partner', 'marriage',
    'family conflict', 'family issues', 'dating', 'romance'
  ],
  academic_stress: [
    'academic stress', 'coursework', 'exams', 'failing', 'grades',
    'study', 'homework', 'assignment', 'thesis', 'dissertation',
    'time management', 'procrastination', 'academic pressure'
  ],
  general: []
};

// Keyword patterns for case report categorization
const caseKeywords: Record<CaseCategory, string[]> = {
  sexual_harassment: [
    'sexual harassment', 'inappropriate touching', 'unwanted advances',
    'sexual comments', 'groping', 'sexual favors', 'quid pro quo', 'sexually abused',
    'sexual pressure', 'inappropriate comments about appearance', 'sexual abuse','sexually assaulted'
  ],
  sexual_harassment_gbv: [
    'gender based violence', 'gender-based violence', 'sexual harassment', 'unwanted advances',
    'sexual comments', 'groping', 'sexual favors', 'quid pro quo', 'sexually abused',
    'sexual pressure', 'sexual abuse', 'sexual assault', 'sexually assaulted', 'rape', 'raped',
    'forced', 'coerced', 'violence', 'physical abuse', 'hit', 'beaten', 'abused', 'harassed', 'assaulted'
  ],
  gbv: [
    'gender based violence', 'gbv', 'domestic violence', 'intimate partner violence',
    'rape', 'raped', 'sexual assault', 'sexually assaulted', 'forced', 'coerced', 'violence',
    'physical abuse', 'hitting', 'beating', 'threatening'
  ],
  financial_aid: [
    'financial aid', 'tuition', 'fees', 'bursary', 'scholarship',
    'payment plan', 'cant afford', 'financial emergency', 'money problems',
    'financial difficulty', 'struggling to pay'
  ],
  academic_misconduct: [
    'academic misconduct', 'cheating', 'cheated', 'plagiarism', 'plagiarized', 'fraud',
    'unfair grading', 'grade dispute', 'exam irregularity'
  ],
  discrimination: [
    'discrimination', 'racism', 'sexism', 'homophobia', 'transphobia',
    'bias', 'prejudice', 'unfair treatment', 'excluded because'
  ],
  health_services: [
    'health', 'medical', 'sick', 'illness', 'medication',
    'clinic', 'hospital', 'doctor', 'mental health services'
  ],
  housing: [
    'housing', 'accommodation', 'dormitory', 'hostel', 'room',
    'roommate', 'living situation', 'homeless'
  ],
  sexual_assault: [
    'sexual assault', 'sexually assaulted', 'rape', 'raped', 'molested', 'molestation', 'forced sex',
    'non-consensual', 'sexual abuse', 'fondling', 'sexual violence'
  ],
  physical_assault: [
    'physical assault', 'beaten', 'beating', 'hit', 'punched', 'kicked',
    'slapped', 'strangled', 'choked', 'physical attack', 'assaulted'
  ],
  stalking: [
    'stalking', 'stalked', 'following me', 'harassing', 'obsessed',
    'watching me', 'showing up', 'unwanted attention', 'threats'
  ],
  cyberbullying: [
    'cyberbullying', 'online harassment', 'social media', 'bullying online',
    'hacked', 'spread rumors', 'embarrassing photos', 'revenge porn'
  ],
  substance_abuse: [
    'substance abuse', 'drug abuse', 'alcohol abuse', 'addiction',
    'drugs', 'alcoholism', 'narcotics', 'overdose', 'rehabilitation'
  ],
  mental_health: [
    'mental health', 'depression', 'anxiety', 'ptsd', 'trauma',
    'counseling', 'therapy', 'psychiatric', 'suicidal thoughts'
  ],
  relationship_violence: [
    'relationship violence', 'domestic abuse', 'partner violence',
    'intimate violence', 'abusive relationship', 'controlling partner'
  ],
  general: []
};

// Urgency indicators for counseling
const urgencyIndicators = {
  immediate: [
    'right now', 'immediately', 'emergency', 'urgent', 'crisis',
    'suicide', 'kill myself', 'end my life', 'hurt myself',
    'happening now', 'need help now', 'cant wait'
  ],
  critical: [
    'very urgent', 'severe', 'serious', 'critical', 'dangerous',
    'unsafe', 'at risk', 'in danger', 'scared for my safety',
    'cant cope', 'breaking down'
  ],
  high: [
    'urgent', 'soon as possible', 'asap', 'important',
    'struggling badly', 'getting worse', 'cant handle'
  ],
  medium: [
    'would like to discuss', 'need support', 'help with',
    'concerned about', 'dealing with'
  ],
  low: [
    'general', 'question', 'information', 'advice',
    'curious about', 'wondering'
  ]
};

// Danger indicators for case reports
const dangerIndicators = [
  'happening now', 'right now', 'currently', 'at this moment',
  'being attacked', 'being harassed', 'being hurt', 'in danger',
  'help me', 'need help immediately', 'emergency'
];

/**
 * Categorize counseling request based on keywords
 */
export function categorizeCounselingRequest(description: string): {
  category: CounselingCategory;
  urgency: UrgencyLevel;
  requiresImmediateAttention: boolean;
  matchedKeywords: string[];
} {
  const lowerDesc = description.toLowerCase();
  let bestCategory: CounselingCategory = 'general';
  let maxMatches = 0;
  const matchedKeywords: string[] = [];

  // Find category with most keyword matches
  for (const [category, keywords] of Object.entries(counselingKeywords)) {
    const matches = keywords.filter(kw => lowerDesc.includes(kw.toLowerCase()));
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      bestCategory = category as CounselingCategory;
      matchedKeywords.push(...matches);
    }
  }

  // Determine urgency level
  let urgency: UrgencyLevel = 'medium';
  let requiresImmediateAttention = false;

  for (const keyword of urgencyIndicators.immediate) {
    if (lowerDesc.includes(keyword.toLowerCase())) {
      urgency = 'immediate';
      requiresImmediateAttention = true;
      break;
    }
  }

  if (urgency !== 'immediate') {
    for (const keyword of urgencyIndicators.critical) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        urgency = 'critical';
        break;
      }
    }
  }

  if (urgency !== 'immediate' && urgency !== 'critical') {
    for (const keyword of urgencyIndicators.high) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        urgency = 'high';
        break;
      }
    }
  }

  if (urgency !== 'immediate' && urgency !== 'critical' && urgency !== 'high') {
    for (const keyword of urgencyIndicators.low) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        urgency = 'low';
        break;
      }
    }
  }

  // Critical categories always require immediate attention
  if (['suicide', 'self_harm'].includes(bestCategory)) {
    requiresImmediateAttention = true;
    urgency = urgency === 'low' || urgency === 'medium' ? 'immediate' : urgency;
  }

  return {
    category: bestCategory,
    urgency,
    requiresImmediateAttention,
    matchedKeywords
  };
}

/**
 * Categorize case report based on keywords
 */
export function categorizeCaseReport(description: string): {
  category: CaseCategory;
  urgency: UrgencyLevel;
  requiresLocationSharing: boolean;
  matchedKeywords: string[];
} {
  const lowerDesc = description.toLowerCase();
  let bestCategory: CaseCategory = 'general';
  let maxMatches = 0;
  const matchedKeywords: string[] = [];

  // Find category with most keyword matches
  for (const [category, keywords] of Object.entries(caseKeywords)) {
    const matches = keywords.filter(kw => lowerDesc.includes(kw.toLowerCase()));
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      bestCategory = category as CaseCategory;
      matchedKeywords.push(...matches);
    }
  }

  // Check for immediate danger
  let requiresLocationSharing = false;
  let urgency: UrgencyLevel = 'medium';

  for (const keyword of dangerIndicators) {
    if (lowerDesc.includes(keyword.toLowerCase())) {
      requiresLocationSharing = true;
      urgency = 'immediate';
      break;
    }
  }

  // GBV and sexual harassment get higher priority
  if (['gbv', 'sexual_harassment', 'sexual_assault', 'physical_assault', 'stalking', 'relationship_violence'].includes(bestCategory) && !requiresLocationSharing) {
    urgency = urgency === 'low' || urgency === 'medium' ? 'high' : urgency;
  }

  return {
    category: bestCategory,
    urgency,
    requiresLocationSharing,
    matchedKeywords
  };
}

/**
 * Get routing destination for case report
 */
export const SENSITIVE_CASE_CATEGORIES: CaseCategory[] = [
  'sexual_harassment_gbv',
  'sexual_harassment',
  'gbv',
  'sexual_assault',
  'physical_assault',
];

export function isSensitiveCaseCategory(category: CaseCategory | string | null | undefined): boolean {
  return category != null && SENSITIVE_CASE_CATEGORIES.includes(category as CaseCategory);
}

export function getCaseReportRouting(category: CaseCategory): 'dean' | 'iic' | 'registrar' | 'disciplinary' {
  switch (category) {
    case 'sexual_harassment_gbv':
    case 'sexual_harassment':
    case 'gbv':
    case 'sexual_assault':
    case 'physical_assault':
    case 'stalking':
      return 'iic';
    case 'financial_aid':
      return 'dean';
    case 'academic_misconduct':
      return 'disciplinary';
    case 'discrimination':
    case 'health_services':
    case 'housing':
    case 'cyberbullying':
    case 'substance_abuse':
    case 'mental_health':
    case 'relationship_violence':
    case 'general':
      return 'dean';
    default:
      return 'dean';
  }
}
