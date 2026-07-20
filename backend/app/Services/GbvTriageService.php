<?php

namespace App\Services;

class GbvTriageService
{
    private const GBV_KEYWORDS = [
        'gender based violence', 'gbv', 'domestic violence', 'intimate partner violence',
        'rape', 'raped', 'sexual assault', 'sexually assaulted', 'sexually harassed',
        'forced', 'coerced', 'violence', 'assaulted', 'assault',
        'physical abuse', 'hitting', 'beating', 'threatening',
    ];

    private const SEXUAL_HARASSMENT_KEYWORDS = [
        'sexual harassment', 'sexual abuse', 'sexually abused', 'inappropriate touching', 'unwanted advances',
        'sexual comments', 'groping', 'sexual favors', 'quid pro quo', 'groped', 'sexually harrassed',
        'sexual pressure', 'inappropriate comments about appearance', 'harassed',
    ];

    private const SEXUAL_ASSAULT_KEYWORDS = [
        'sexual assault', 'rape', 'raped', 'sexually assaulted', 'forced sex',
        'molested', 'molestation', 'non-consensual', 'sexual violence',
    ];

    private const DANGER_KEYWORDS = [
        'happening now', 'right now', 'currently', 'at this moment',
        'being attacked', 'being harassed', 'being hurt', 'in danger',
        'help me', 'need help immediately', 'emergency', 'abused','forced',
    ];

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function triage(array $data): array
    {
        $description = strtolower($data['description'] ?? '');
        $matchedKeywords = [];
        $category = $data['category'] ?? 'general';
        $detailedCategory = $data['detailed_category'] ?? $data['sub_category'] ?? null;

        $gbvMatches = $this->matchKeywords($description, self::GBV_KEYWORDS);
        $shMatches = $this->matchKeywords($description, self::SEXUAL_HARASSMENT_KEYWORDS);
        $sexualAssaultMatches = $this->matchKeywords($description, self::SEXUAL_ASSAULT_KEYWORDS);
        $dangerMatches = $this->matchKeywords($description, self::DANGER_KEYWORDS);

        if (count($gbvMatches) > 0 || count($shMatches) > 0 || count($sexualAssaultMatches) > 0) {
            if (count($sexualAssaultMatches) > 0) {
                $category = 'sexual_assault';
                $detailedCategory = 'sexual_assault';
                $matchedKeywords = array_values(array_unique(array_merge($gbvMatches, $shMatches, $sexualAssaultMatches)));
            } else {
                // Prefer explicit sexual harassment signals when present (e.g., "sexually harassed").
                if (count($shMatches) > 0 && count($gbvMatches) === 0) {
                    $category = 'sexual_harassment_gbv';
                    $detailedCategory = 'sexual_harassment';
                    $matchedKeywords = array_values(array_unique(array_merge($shMatches, $gbvMatches)));
                } else {
                    // Fallback: keep the combined GBV/SH bucket but pick the dominant detailed category
                    $category = 'sexual_harassment_gbv';
                    $detailedCategory = count($gbvMatches) > count($shMatches) ? 'gbv' : 'sexual_harassment';
                    $matchedKeywords = array_values(array_unique(array_merge($gbvMatches, $shMatches)));
                }
            }
        }

        $urgency = $data['urgency_level'] ?? 'medium';
        $requiresLocation = (bool) ($data['requires_location_sharing'] ?? false);
        // Ignore any client-provided anonymous flag; reports are always handled as ticketed cases.

        if (count($dangerMatches) > 0) {
            $urgency = 'immediate';
            $requiresLocation = true;
            $matchedKeywords = array_values(array_unique(array_merge($matchedKeywords, $dangerMatches)));
        } elseif ($category === 'sexual_harassment_gbv' && ! in_array($urgency, ['immediate', 'critical', 'high'], true)) {
            $urgency = 'high';
        }

        $assignedRole = $this->routeCategory($category, $detailedCategory);
        $workflowStage = $assignedRole === 'iic' ? 'at_iic' : 'at_iic';

        return array_merge($data, [
            'category' => $category,
            'detailed_category' => $detailedCategory,
            'sub_category' => $detailedCategory,
            'urgency_level' => $urgency,
            'requires_location_sharing' => $requiresLocation,
            'is_anonymous' => false,
            'matched_keywords' => array_values(array_unique(array_merge(
                $data['matched_keywords'] ?? [],
                $matchedKeywords
            ))),
            'assigned_role' => $assignedRole,
            'workflow_stage' => $workflowStage,
            'status' => 'submitted',
            'student_id' => $data['student_id'] ?? null,
        ]);
    }

    public function isUrgent(array $data): bool
    {
        return in_array($data['urgency_level'] ?? '', ['immediate', 'critical', 'high'], true)
            || in_array($data['category'] ?? '', ['sexual_harassment_gbv', 'sexual_assault'], true);
    }

    private function routeCategory(string $category, ?string $detailed): string
    {
        $abuseCategories = [
            'sexual_harassment_gbv', 'sexual_harassment', 'gbv',
            'sexual_assault', 'physical_assault', 'stalking',
        ];

        if (in_array($category, $abuseCategories, true) || in_array($detailed, ['gbv', 'sexual_harassment', 'sexual_assault', 'physical_assault', 'stalking'], true)) {
            return 'iic';
        }

        return match ($category) {
            'financial_aid' => 'dean',
            'academic_misconduct' => 'disciplinary_committee',
            default => 'dean',
        };
    }

    /**
     * @param  string[]  $keywords
     * @return string[]
     */
    private function matchKeywords(string $text, array $keywords): array
    {
        $matches = [];
        foreach ($keywords as $keyword) {
            if (str_contains($text, strtolower($keyword))) {
                $matches[] = $keyword;
            }
        }

        return $matches;
    }
}
