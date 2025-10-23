// This file simulates a neural network for image generation, trained on a vast corpus of financial articles and images.
// It uses a knowledge base of keyword-to-icon/theme mappings to generate a relevant
// and aesthetically pleasing image for each news event by searching online.

// --- Keyword to Concept Mapping (Simulated Semantic Layer) ---
const KEYWORD_ASSOCIATIONS: Record<string, string> = {
    'surge': 'positive', 'rallies': 'positive', 'growth': 'positive', 'cheers': 'positive', 'groundbreaking': 'positive', 'breakthrough': 'positive', 'success': 'positive', 'approval': 'positive', 'boom': 'positive', 'peace': 'positive', 'wins': 'positive', 'deal': 'positive', 'unveils': 'positive', 'soars': 'positive', 'gains': 'positive', 'momentum': 'positive', 'expansion': 'positive', 'innovation': 'innovation', 'upgrade': 'positive', 'accelerates': 'positive', 'benefits': 'positive', 'rise': 'positive',
    'plummet': 'negative', 'tumbles': 'negative', 'headwinds': 'negative', 'drops': 'negative', 'warning': 'negative', 'fears': 'negative', 'concern': 'negative', 'failure': 'negative', 'breach': 'negative', 'recall': 'negative', 'recession': 'recession', 'war': 'negative', 'pandemic': 'negative', 'scandal': 'negative', 'uncertainty': 'negative', 'shutdown': 'negative', 'damage': 'negative', 'disrupting': 'negative', 'strikes': 'negative', 'anxious': 'negative', 'looms': 'negative', 'pressure': 'negative', 'delay': 'negative', 'downfall': 'negative', 'outage': 'negative', 'cuts': 'negative', 'sanctions': 'negative', 'threat': 'negative', 'crisis': 'negative', 'plagued': 'negative', 'suffers': 'negative',
    'split': 'split',
    'chip': 'Technology', 'ai': 'Technology', 'software': 'Technology', 'cyber': 'Technology', 'data': 'Technology', 'cloud': 'Technology', 'quantum': 'Technology', 'internet': 'Technology', 'robotics': 'Technology', 'tech': 'Technology', 'digital': 'Technology', 'platform': 'Technology',
    'fda': 'Health', 'drug': 'Health', 'health': 'Health', 'medical': 'Health', 'pharma': 'Health', 'clinic': 'Health', 'genomics': 'Health', 'therapy': 'Health', 'vaccine': 'Health', 'hospital': 'Health', 'wellness': 'Health',
    'energy': 'Energy', 'solar': 'Energy', 'oil': 'Energy', 'efficiency': 'Energy', 'subsidy': 'Energy', 'hydro': 'Energy', 'wind': 'Energy', 'nuclear': 'Energy', 'battery': 'Energy', 'grid': 'Energy', 'carbon': 'Energy',
// Fix: Removed duplicate 'finance' key.
    'finance': 'Finance', 'earnings': 'Finance', 'fintech': 'Finance', 'rate': 'Finance', 'rating': 'Finance', 'bank': 'Finance', 'insurance': 'Finance', 'lend': 'Finance', 'trade': 'Finance', 'invest': 'Finance', 'funds': 'Finance', 'ipo': 'Finance',
    'industrials': 'Industrials', 'contract': 'Industrials', 'supply': 'Industrials', 'factory': 'Industrials', 'logistics': 'Industrials', 'aero': 'Industrials', 'ship': 'Industrials', 'build': 'Industrials', 'auto': 'Industrials', 'rail': 'Industrials', 'manufacturing': 'Industrials', 'infrastructure': 'Industrials', 'commodity': 'Industrials',
    'global': 'macro', 'market': 'macro', 'economy': 'macro', 'macroeconomic': 'macro', 'world': 'macro',
// Fix: Removed duplicate 'trade' key which conflicted with the one under Finance.
    'political': 'political', 'election': 'political', 'government': 'political', 'policy': 'political', 'regulations': 'political',
    'hurricane': 'disaster', 'earthquake': 'disaster', 'wildfires': 'disaster', 'natural': 'disaster', 'storm': 'disaster', 'famine': 'disaster',
    'routine': 'neutral', 'minor': 'neutral', 'update': 'update', 'reshuffle': 'neutral', 'meeting': 'neutral', 'stable': 'stability', 'engagement': 'neutral', 'renovation': 'neutral', 'renewal': 'neutral', 'personnel': 'neutral', 'audit': 'neutral', 'showcase': 'neutral', 'review': 'neutral', 'dialogue': 'neutral', 'adjustment': 'neutral',
};


/**
 * Simulates a neural network trained on Google News to generate a relevant image.
 * It processes the headline, identifies key concepts, and constructs a query to fetch an
 * image from an online source.
 */
export const getImageForEvent = (headline: string, ...extraKeywords: string[]): string => {
    const combinedText = [headline, ...extraKeywords].join(' ').toLowerCase();
    
    let primaryConcept: string | null = null;
    let secondaryConcept: string | null = null;

    const priorities: Record<string, number> = { 
        'political': 5, 'disaster': 5, 'recession': 5, 'growth': 5,
        'macro': 4, 'sector': 3, 'sentiment': 2, 'action': 1, 'default': 0, 'neutral': 1, 'innovation': 4, 'merger': 4, 'alliance': 4, 'stability': 2, 'update': 2
    };

    // Determine the most relevant concepts from keywords
    for (const keyword in KEYWORD_ASSOCIATIONS) {
        if (combinedText.includes(keyword)) {
            const concept = KEYWORD_ASSOCIATIONS[keyword];
            
            // Prioritize specific event types
            if (['political', 'disaster', 'recession', 'growth', 'innovation', 'merger', 'alliance'].includes(concept) && ((priorities as any)[concept] || 0) > ((priorities as any)[primaryConcept] || 0)) {
                primaryConcept = concept;
            } else if (['Technology', 'Health', 'Energy', 'Finance', 'Industrials'].includes(concept) && ((priorities as any)['sector'] || 0) >= ((priorities as any)[primaryConcept] || 0)) {
                if (!primaryConcept || (priorities[primaryConcept] < priorities['sector'])) {
                    primaryConcept = concept;
                }
            } else if (['positive', 'negative', 'neutral'].includes(concept) && ((priorities as any)['sentiment'] || 0) >= ((priorities as any)[secondaryConcept] || 0)) {
                if (!secondaryConcept || (priorities[secondaryConcept] < priorities['sentiment'])) {
                    secondaryConcept = concept;
                }
            } else if (((priorities as any)[concept] || 0) > ((priorities as any)[primaryConcept] || 0)) {
                 primaryConcept = concept;
            }
        }
    }

    if (!primaryConcept && secondaryConcept) {
        primaryConcept = secondaryConcept;
        secondaryConcept = null;
    } else if (primaryConcept && secondaryConcept && ['positive', 'negative', 'neutral'].includes(primaryConcept)) {
        // keep as is
    } else if (primaryConcept && secondaryConcept && !['positive', 'negative', 'neutral'].includes(primaryConcept)) {
        if (secondaryConcept && (priorities[secondaryConcept] > (priorities[primaryConcept] || 0))) {
            primaryConcept = secondaryConcept;
            secondaryConcept = null;
        }
    }
    
    const searchTerms = new Set<string>();

    if (primaryConcept && primaryConcept !== 'default') {
        searchTerms.add(primaryConcept);
    }
    
    const sector = extraKeywords.find(kw => ['Technology', 'Health', 'Energy', 'Finance', 'Industrials'].includes(kw));
    if (sector) {
        searchTerms.add(sector);
    }
    
    // Fallback to extra keywords if we have no concepts
    if (searchTerms.size === 0 && extraKeywords.length > 0) {
        searchTerms.add(extraKeywords[0]);
    }

    // Filter out abstract concepts that are not good for image search
    const badKeywords = ['positive', 'negative', 'neutral', 'default', 'update', 'stability', 'recession', 'growth', 'action', 'sentiment', 'split'];
    let finalTerms = Array.from(searchTerms).filter(term => !badKeywords.includes(term));

    // If filtering removed everything, add defaults
    if (finalTerms.length === 0) {
        finalTerms = ['business', 'finance'];
    }
    
    const query = finalTerms.slice(0, 3).join(',');
    
    // FIX: Switched to the more reliable `/featured/` endpoint for Unsplash
    // and removed the unnecessary cache-busting `sig` parameter to improve
    // image loading reliability.
    return `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(query)}`;
};