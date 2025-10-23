import { ActiveEvent } from '../types';

// This file simulates a text-generation neural network using templates and vocabulary pools,
// designed to mimic the style of financial news outlets.

const VOCABULARY = {
    headlines: {
        positive: [
            "Surges After Announcing", "Rallies on News of", "Poised for Growth Following", "Jumps as Market Cheers", 
            "Announces Groundbreaking", "Gets a Boost from", "Shares Climb as Unveils", "Stock Soars on Positive Outlook", 
            "Gains Momentum with", "Achieves Milestone After", "Secures Landmark Deal for", "Reports Stellar Performance in", 
            "Breaks Records with New", "Outperforms Expectations on", "Unlocks New Opportunities With", "Expands Reach Via",
            "Revolutionizes Industry With", "Receives Acclaim for", "Secures Major Funding for", "Propelled by Strong Demand for"
        ],
        negative: [
            "Plummets Amid Fears of", "Tumbles After Revealing", "Faces Headwinds Due to", "Stock Drops on Concern Over", 
            "Issues Warning Regarding", "Braces for Impact of", "Investors Anxious as Faces", "Uncertainty Looms Over Following", 
            "Under Pressure Amid", "Experiences Setback After", "Recalls Product Following", "Suffers Blow from Unexpected", 
            "Revenue Misses Estimates After", "Navigates Challenging Landscape with", "Struggles with Supply Chain Issues After",
            "Hit by Regulatory Crackdown Over", "Slumps on Weakening Demand for", "Controversy Erupts Over",
            "Shares Slide After Disappointing", "Warns of Profit Decline Due To"
        ],
        neutral: [
            "Holds Routine Board Meeting", "Announces Minor Personnel Change", "Releases Quarterly Report with Stable Figures", 
            "Updates Policy on Remote Work", "Completes Internal Review of Operations", "Renews Key Supplier Contract", 
            "Hosts Industry Engagement Forum", "Issues Clarification on Previous Statement", "Adjusts Internal Performance Targets",
            "Considers Strategic Options for", "Explores New Market Segments For", "Initiates Pilot Program for",
            "Completes Audit of", "Reaffirms Long-Term Vision For", "Prepares for Upcoming Investor Day on"
        ],
        split: [
            "Announces Stock Split to", "Moves to Increase Liquidity with", "Approves Share Split Following",
            "Plans for Enhanced Shareholder Accessibility With", "Signals Confidence with Upcoming"
        ],
        political: [
            "Faces Uncertainty Amid New", "Benefits from Favorable New", "Navigates Shifting Landscape of", "Impacted by new",
            "Responds to Government's", "Braces for Political Shift After"
        ],
        disaster: [
            "Operations Disrupted by", "Warns of Impact from", "Faces Supply Chain Crisis Following", "Reroutes Logistics Due to",
            "Announces Recovery Plan After", "Contributes to Relief Efforts for"
        ],
    },
    summaries: { // Short summaries for card views
        positive: [
            "Boosts investor confidence.", "Positive market reaction.", "Signals strong growth.", "Sets new industry standard.", 
            "Promising outlook ahead.", "Significant valuation increase.", "Market anticipates future gains."
        ],
        negative: [
            "Triggers investor concern.", "Market reacts negatively.", "Raises operational questions.", "Faces significant challenges.", 
            "Uncertainty on the horizon.", "Profitability under threat.", "Share price decline expected."
        ],
        neutral: [
            "No significant market impact.", "Routine business update.", "Standard operational procedure.", 
            "Maintaining status quo.", "Focus on long-term stability.", "Minor procedural adjustments.", "Consolidating current position."
        ],
        split: [
            "Increases share accessibility.", "Aims to boost trading volume.", "Reflects strong valuation.",
            "Attracts new retail investors.", "Optimizes capital structure."
        ],
        political: [
            "Geopolitical shifts impact markets.", "New policies create uncertainty.", "Trade relations under review.",
            "Regulatory changes loom.", "Election results create volatility."
        ],
        disaster: [
            "Natural disaster impacts region.", "Supply chains face disruption.", "Infrastructure damage reported.",
            "Economic activity halted.", "Humanitarian crisis unfolds."
        ],
    },
    openers: {
        positive: [
            "In a significant move that buoyed investor confidence, {company} today announced", 
            "Shares of {company} saw a dramatic uptick today following the announcement of", 
            "The market responded with enthusiasm to news from {company} regarding", 
            "A wave of optimism swept through the markets today after the confirmation of", 
            "{company} captured the market's attention on Tuesday with news of",
            "Analysts are buzzing with excitement after {company} unveiled",
            "A strategic play by {company} has sent its stock soaring, reflecting strong market belief in",
            "Breaking through previous expectations, {company} delivered a powerful message with",
            "With an eye towards future growth, {company} initiated a pivotal development concerning",
            "The latest breakthrough from {company} promises to redefine sector benchmarks, driven by"
        ],
        negative: [
            "A shadow was cast over the markets today as {company} confirmed troubling reports of", 
            "{company} is facing a challenging period ahead after it revealed", 
            "Investor sentiment soured for {company} following the release of news concerning", 
            "Global markets are on edge following the breaking news of", 
            "An air of uncertainty surrounds {company} today, as the firm grapples with",
            "Concerns are mounting for {company} after a recent disclosure highlighted",
            "The latest development for {company} has sent ripples of worry through its shareholder base, causing",
            "In a sudden downturn, {company} experienced significant market pressure due to",
            "A critical misstep by {company} has led to widespread speculation regarding",
            "The financial outlook for {company} dimmed considerably following the announcement of"
        ],
        neutral: [
            "In a routine announcement that provided little surprise, {company} today indicated",
            "{company} today released details concerning its ongoing operations, which included",
            "The latest update from {company} focused on standard business procedures and initiatives, indicating",
            "As part of its regular corporate communications, {company} issued a statement regarding",
            "Market observers noted that {company}'s recent disclosure offered no significant deviations from established patterns, detailing",
            "Maintaining its established course, {company} conveyed information about",
            "Without significant fanfare, {company} informed stakeholders about",
            "Focusing on internal consistency, {company} outlined its latest efforts in",
            "In a move designed to ensure transparency, {company} shared details regarding",
            "The management of {company} provided an update on various administrative matters, specifically touching upon"
        ],
    },
    details: {
        positive: [
            "This development is seen by many as a validation of the company's strategic direction, underscoring its commitment to innovation and market leadership. The positive sentiment is palpable across trading floors.", 
            "The announcement is expected to solidify its market position and create new, substantial revenue streams, potentially reshaping competitive dynamics within the industry. Future projections look increasingly robust.", 
            "Experts believe this could be a major catalyst for future earnings, pending successful execution and continued market traction. Stakeholders are eagerly anticipating the next phase of implementation.", 
            "The move is widely interpreted as a proactive step to address evolving market demands and stay significantly ahead of the competition, demonstrating agile responsiveness. It is a testament to strong corporate vision.",
            "This strategic initiative is expected to unlock considerable shareholder value and attract new institutional investment, reinforcing the firm's financial stability and growth prospects. It signals a robust future.",
            "Key industry figures have lauded the innovative approach taken by the company, suggesting it could set a new benchmark for operational efficiency and technological integration. This marks a pivotal moment.",
            "Furthermore, this success is anticipated to foster further collaborative ventures and talent acquisition, bolstering the company's long-term competitive edge in a fast-evolving market. The synergy created is immense.",
            "The initial market response has been overwhelmingly positive, with significant trading volumes indicating strong investor confidence and a reevaluation of the stock's intrinsic value. Momentum is clearly building.",
            "This accomplishment underscores a period of sustained research and development, culminating in a product or service that meets critical unmet needs and expands the total addressable market. Visionary leadership is cited.",
            "It is expected that this will lead to a significant increase in market share, as the company leverages its first-mover advantage and robust intellectual property to secure a dominant position. A new era of expansion begins."
        ],
        negative: [
            "The full financial impact of this event remains to be seen, but early indicators are concerning, suggesting a potential hit to quarterly earnings and long-term profitability. Investors are advised to exercise caution.", 
            "This raises serious questions about the company's internal controls and risk management protocols, prompting calls for greater transparency and accountability from leadership. Scrutiny is intensifying.", 
            "The company's leadership is now under intense pressure to formulate a comprehensive response and mitigate the damage, which could include significant restructuring or strategic divestments. The path forward appears challenging.", 
            "The ripple effects of this event could be felt across the economy for months to come, impacting supply chains, consumer confidence, and overall market stability. A broader market downturn is not out of the question.",
            "Financial analysts have already begun downgrading their outlook for the stock, citing increased operational risks and potential erosion of market share. This development could linger for some time.",
            "Concerns over regulatory backlash and potential legal challenges are also adding to the pressure, complicating the company's efforts to recover its standing. The reputational damage is substantial.",
            "Furthermore, the incident has highlighted vulnerabilities in the firm's operational infrastructure, leading to calls for immediate and costly upgrades to prevent future occurrences. Remedial costs are estimated to be high.",
            "The immediate market reaction saw a sharp decline in share price, indicating a loss of investor trust and a reassessment of the company's stability amidst heightened risk factors. This trend is worrying.",
            "This unfortunate turn of events casts a long shadow over the company's future projects and partnerships, potentially delaying key initiatives and dampening enthusiasm for innovation. Morale is reportedly low.",
            "Observers suggest that the company may face protracted legal battles or significant penalties, which could divert substantial resources away from core business activities and innovation. The financial strain is considerable."
        ],
        neutral: [
            "This update provides a granular look into the company's internal workings, offering transparency without indicating any immediate shift in market standing. It reflects a period of consolidation.",
            "While not directly impacting revenue or market share, the developments signify the company's continuous efforts to optimize its organizational structure and operational flow. It's a foundational adjustment.",
            "The announcement is largely procedural, designed to keep stakeholders informed about routine administrative and strategic reviews. It reinforces the stability of existing corporate governance.",
            "Market participants are not expected to react significantly to this information, as it aligns with previously communicated objectives and long-term strategies. Business as usual, for now.",
            "Observers note that such internal recalibrations are common in mature industries, aimed at maintaining efficiency rather than spurring rapid growth. It's about refinement, not revolution.",
            "The company's consistent adherence to its stated objectives, as outlined in this communication, provides a bedrock of predictability in an otherwise dynamic market. Investors value this steadiness.",
            "This review process is a standard part of good corporate stewardship, ensuring that operational frameworks are robust and aligned with evolving industry best practices. It signifies due diligence.",
            "No immediate financial implications are foreseen from this update, as the actions described fall within anticipated operational expenditures and strategic planning. Fiscal neutrality is maintained.",
            "The focus remains on incremental improvements and solidifying existing market positions rather than pursuing high-risk, high-reward ventures. A conservative but steady strategy is evident.",
            "These internal adjustments are designed to enhance long-term resilience and adaptability, preparing the company for future market shifts without immediate reactive measures. Proactive planning is highlighted."
        ],
        political: [
            "The new regulations are expected to have a mixed impact across various sectors, with some companies poised to benefit while others face significant compliance hurdles. The market is still digesting the full scope of the legislation.",
            "This trade agreement is a landmark deal that could redefine global commerce for years to come. Analysts are optimistic about the long-term benefits for export-oriented economies, but are wary of potential disruptions for domestic industries.",
            "The election results have introduced a new layer of uncertainty into the market. Investors are closely watching for signals on fiscal policy, international relations, and corporate taxation, leading to a period of heightened volatility."
        ],
        disaster: [
            "The immediate priority is the humanitarian response, but the long-term economic consequences of this disaster are already a major concern. Supply chain disruptions are expected to persist for months, impacting global production.",
            "Infrastructure damage is extensive, with initial estimates running into the billions. The rebuilding effort will be a monumental task, likely requiring both public and private investment over the next decade.",
            "Key industries in the affected region, from agriculture to high-tech manufacturing, have been brought to a standstill. The ripple effects will be felt globally as companies scramble to find alternative suppliers and reroute logistics."
        ],
    },
    analyst_titles: [ 
        "a senior market analyst at OmniCap", "a technology sector expert from Innovest", "a lead researcher at Capital Insights", 
        "a veteran strategist with MacroView Analytics", "an industry watchdog from SectorPulse", "a geopolitical risk consultant from Strata-G", 
        "Chief Economist at Global Dynamics", "Head of Research at QuantAlpha Capital", "a leading financial commentator for MarketView News", 
        "Senior Portfolio Manager at Evergreen Investments", "Director of Research at Zenith Fund Management", "Lead Strategist at Apex Global",
        "Market Intelligence Lead at Horizon Asset Group", "Principal Analyst at BlueWave Equities", "Head of Quantitative Analysis at Citadel Prime"
    ],
    analyst_quotes: {
        positive: [
            '"This is a clear and decisive move by {company}. It demonstrates their ability to innovate and adapt in a rapidly changing landscape," commented {analyst}. "We\'re seeing a fundamental strength here that could set a new benchmark for the industry and drive significant future returns."', 
            '"The market has been waiting for a positive signal, and this is it. We are upgrading our rating to \'Buy\' based on this news, anticipating substantial upside potential in the coming quarters," stated {analyst}.',
            '"This political development is exactly the kind of catalyst the markets needed to break out of their recent slump," explained {analyst}. "It removes a significant layer of uncertainty and opens new avenues for global economic cooperation, boosting confidence across the board."',
            '"The strategic implications of this announcement cannot be overstated," {analyst} added. "It’s a bold step that positions {company} for long-term dominance in a key growth segment, reflecting robust management vision."',
            '"We believe this marks a turning point for the sector, with {company} leading the charge. The positive momentum is likely to attract further investment and foster a competitive environment," noted {analyst}.',
            '"The innovation displayed here is truly remarkable, setting a new standard for what is possible within the {sector} sector. This will undoubtedly attract more attention from institutional investors," shared {analyst}.',
            '"Such decisive action by {company} reflects a deep understanding of market dynamics and a commitment to shareholder value. This bodes extremely well for future performance," observed {analyst}.',
            '"This reinforces our positive outlook for {company}, demonstrating an ability to not only adapt but also to lead during periods of intense competition and technological shift," said {analyst}.',
            '"The sentiment is overwhelmingly positive. We expect this to translate into significant market capitalization growth and improved investor confidence over the medium term," predicted {analyst}.',
            '"This development is a strong testament to the leadership and strategic foresight within {company}, positioning it as a frontrunner in its competitive landscape," concluded {analyst}.'
        ],
        negative: [
            '"The situation is still developing, but this is certainly a major headwind for {company}," stated {analyst}. "The key question now is how leadership will respond and whether they can restore confidence and mitigate the financial fallout. We advise a cautious \'Hold\' for now."', 
            '"This was an unforced error, and it\'s going to take significant time and resources to rebuild trust with both consumers and investors," said {analyst}. "The reputational damage alone could have lasting effects on brand loyalty and market perception."',
            '"Geopolitical instability or natural disasters of this scale introduce a level of uncertainty that markets simply hate," said {analyst}. "Expect increased volatility as the situation unfolds, with safe-haven assets likely outperforming and riskier assets facing significant selling pressure."',
            '"The market is clearly punishing {company} for what appears to be a significant misstep," {analyst} remarked. "This could lead to a prolonged period of underperformance until a clear recovery strategy is articulated and executed effectively."',
            '"Concerns about broader market contagion are also rising, as this event could signal underlying vulnerabilities in the {sector} sector or global economy," warned {analyst}. "Investors should brace for increased turbulence." ',
            '"The immediate financial repercussions could be substantial, forcing {company} to re-evaluate its short-term strategies and potentially impacting its dividend policy," explained {analyst}.',
            '"This incident highlights a systemic weakness within {company}\'s operational framework that needs urgent attention. Until then, investor confidence will remain severely shaken," commented {analyst}.',
            '"We are downgrading our forecast for {company}, as the path to recovery appears fraught with challenges and uncertainty, with potential long-term implications for its market share," stated {analyst}.',
            '"The negative sentiment generated by this news is likely to persist, creating a difficult environment for {company} to attract new investment or partnerships," observed {analyst}.',
            '"This represents a significant blow to {company}\'s competitive standing and could accelerate shifts in market leadership within the {sector} sector," concluded {analyst}.'
        ],
        neutral: [
            '"This seems to be a largely administrative affair," commented {analyst}. "While every detail matters, this particular announcement is unlikely to shift the needle on {company}\'s valuation in the short term. It simply confirms existing trajectories."',
            '"For long-term investors, these types of disclosures are valuable for understanding operational consistency, but they seldom generate immediate market reactions," stated {analyst}. "It\'s more about steady-state management."',
            '"The market has already priced in much of this information, so the reaction is understandably subdued," observed {analyst}. "This is typical for companies that prioritize transparent and predictable corporate governance, avoiding sudden surprises."',
            '"There\'s nothing here to alarm or excite investors," {analyst} summarized. "It\'s a testament to the company\'s stable operational environment and its commitment to routine updates rather than dramatic shifts, which can be a good thing." ',
            '"We view this as a standard procedural update, reflecting sound internal governance rather than any impending market shift for {company}," said {analyst}.',
            '"Such regular disclosures contribute to market stability by providing continuous information flow without causing undue volatility," noted {analyst}.',
            '"The lack of significant market movement indicates that this news was largely anticipated or falls within typical operational parameters for {company}," explained {analyst}.',
            '"Investors are likely to interpret this as a sign of consistent management and predictable strategic execution, which can be a valuable trait in a dynamic market," observed {analyst}.',
            '"This update confirms that {company} continues to execute its strategy as planned, reinforcing confidence in its long-term stability rather than short-term gains or losses," stated {analyst}.',
            '"The market reaction to this news is a textbook example of a non-event, suggesting that {company} is operating within expected parameters," concluded {analyst}.'
        ]
    },
    market_context: [
        "This news comes amid a period of heightened volatility in the {sector} sector, where investors are keenly watching for any signs of disruption or opportunity. The wider economic climate continues to present a mixed picture.", 
        "The development is particularly noteworthy given the current macroeconomic climate of rising inflation and fluctuating interest rates, adding another layer of complexity to market analysis. Global economic indicators remain closely monitored.", 
        "In a market hungry for direction, this event has provided a clear focal point for traders and algorithms alike, as they attempt to gauge its broader implications for future trends. Sentiment remains fragile.", 
        "The event serves as a stark reminder of how interconnected global markets and geopolitical events are in the modern economy, with impacts often reverberating far beyond initial expectations. Resilience is being tested.",
        "Against a backdrop of increasing technological disruption, this announcement underscores the rapid pace of change facing industries worldwide. Adaptation is key for survival and growth in this new paradigm.",
        "The timing of this release is significant, coming just weeks before major sector-wide economic forecasts are due, and will undoubtedly influence upcoming analyst revisions. Expectations are being recalibrated.",
        "With growing concerns over supply chain resilience and global trade tensions, the market is highly sensitive to any news that might impact operational stability. Every detail is scrutinized.",
        "This occurs as investors are increasingly prioritizing sustainability and ethical governance, placing additional scrutiny on corporate actions and disclosures. ESG factors are now critical considerations.",
        "Amidst a backdrop of robust digital transformation efforts across industries, this development highlights the ongoing evolution of market infrastructures and competitive advantages. The digital economy is ascendant.",
        "The news unfolds during a period of intense innovation and competition, where differentiation and strategic foresight are paramount for companies striving to secure long-term value. Market leadership is hard-won."
    ],
    outlooks: {
        positive: [
            "Looking ahead, the company appears well-positioned to capitalize on this momentum, potentially leading to increased market share and enhanced profitability in the next fiscal year. The future looks bright.", 
            "Analysts will be watching the next earnings call closely to see if this development translates to the bottom line and if the current positive sentiment can be sustained. Growth metrics will be key.", 
            "This move could pave the way for further innovation and market share capture in the coming quarters, setting a precedent for industry best practices. Competitive advantages are strengthening.",
            "The long-term outlook is overwhelmingly positive, with many experts forecasting a sustained period of expansion and potential for further strategic advancements. Investor confidence is high.",
            "Shareholders are encouraged by the firm's proactive stance, which bodes well for dividend growth and overall capital appreciation in the medium to long term. Diversification benefits are also noted.",
            "This strategic success is expected to attract new investment capital and potentially elevate {company}'s standing among blue-chip stocks, signaling a new phase of accelerated growth. Expansion is on the horizon.",
            "The company's robust response to market demands, underscored by this achievement, suggests a resilient business model capable of weathering economic fluctuations and emerging stronger. Adaptability is key.",
            "Expectations are now set higher for {company}, as this breakthrough validates its R&D investments and strengthens its position as a market innovator. The trajectory is decidedly upward.",
            "The long-term implications for the {sector} sector are profound, with {company} potentially spearheading a new era of technological or operational advancement. A paradigm shift may be underway.",
            "This positions {company} favorably for sustained growth, offering compelling reasons for both existing and new investors to consider its long-term value proposition. The future looks compelling."
        ],
        negative: [
            "The company faces a challenging road to recovery, with several quarters of uncertainty likely ahead, as it navigates both internal and external pressures. Strategic adjustments are imperative.", 
            "The full repercussions of this development may not be clear for some time, as secondary effects on partnerships and consumer trust are still being assessed. A cautious approach is warranted.", 
            "This event will likely be a drag on performance for the foreseeable future, potentially impacting their next earnings report and hindering growth initiatives. Remedial actions are urgent.", 
            "The long-term economic consequences are still being calculated, but the short-term outlook appears grim for the affected regions and sectors, necessitating careful portfolio rebalancing. Risk assessment is crucial.",
            "Investors are advised to brace for increased volatility and potential further declines as {company} struggles to regain its footing amidst heightened market skepticism. A challenging period lies ahead.",
            "The incident could lead to a significant reassessment of {company}'s future growth potential and a re-evaluation of its market valuation by analysts. Downward revisions are anticipated.",
            "This situation highlights the inherent risks in the {sector} sector, reminding investors that even established players can face unexpected and severe setbacks. Vigilance is paramount.",
            "The company's ability to navigate this crisis will be a critical test of its leadership and resilience, with market participants closely monitoring every step of its recovery plan. Accountability is key.",
            "The reputational damage may take years to mend, impacting brand loyalty and potentially leading to a permanent erosion of market share if not managed effectively. The consequences are far-reaching.",
            "This development could accelerate a shift in market dynamics, with competitors potentially capitalizing on {company}'s vulnerabilities to gain a strategic advantage. The competitive landscape is heating up."
        ],
        neutral: [
            "Despite the absence of immediate market-moving news, the company's consistent operational reporting suggests a steady course, which can be reassuring in a volatile environment. Stability is the message.",
            "Future communications will be watched for any shifts in these routine patterns, but for now, the outlook remains largely unchanged, focusing on incremental improvements. A slow but steady pace.",
            "This period of consolidation may allow the company to strengthen its foundations, positioning it for more impactful strategic moves further down the line. Patience is key for investors.",
            "The market is accustomed to these types of updates, and analysts expect the company to continue its established trajectory without significant disruption or acceleration. Predictability is valued.",
            "The ongoing strategic reviews are expected to refine rather than revolutionize the company's direction, aiming for optimized performance within existing parameters. Continuous improvement is the goal.",
            "In a market often driven by sensational headlines, {company}'s measured approach to corporate communications provides a refreshing sense of reliability for long-term holders. Steadiness is a virtue.",
            "This reinforces the company's commitment to transparent governance and consistent operations, forming a solid base for future strategic initiatives. Fundamental strength is highlighted.",
            "The financial community generally perceives such updates as confirming the status quo, which in itself can be a form of positive reassurance during periods of broader economic uncertainty. Stability is a strong asset.",
            "While not immediately impacting valuation, these detailed reports offer valuable insights into the operational health and strategic discipline that underpin {company}'s long-term viability. Due diligence is evident.",
            "The company continues to focus on its core business, with these administrative and operational updates reflecting a methodical approach to management that prioritizes sustainable growth over short-term spikes. A prudent strategy."
        ]
    }
};

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const getCompanyName = (event: ActiveEvent) => event.stockName || 'The Market';
const getSectorName = (event: ActiveEvent) => {
    // Determine a more general sector name or context for news generation
    if (event.stockSymbol) {
        // If a stock is involved, use a general sector term.
        // For example, if stock name is "TechGen Inc.", sector is "Technology"
        return event.stockName ? event.stockName.split(' ')[0] : 'Corporate';
    }
    // If it's a macro event, use "global economy" or "financial markets"
    if (event.type === 'political') return 'political landscape';
    if (event.type === 'disaster') return 'affected regions';
    return 'global economy'; 
};

const generateHeadline = (event: ActiveEvent): string => {
    const company = getCompanyName(event);
    const sectorContext = getSectorName(event); // Can be more specific later if needed
    
    let baseHeadline: string;
    switch (event.type) {
        case 'positive':
            baseHeadline = pick(VOCABULARY.headlines.positive);
            break;
        case 'negative':
            baseHeadline = pick(VOCABULARY.headlines.negative);
            break;
        case 'neutral':
            baseHeadline = pick(VOCABULARY.headlines.neutral);
            break;
        case 'split':
             baseHeadline = pick(VOCABULARY.headlines.split);
            break;
        case 'political':
            baseHeadline = pick(VOCABULARY.headlines.political);
            break;
        case 'disaster':
            baseHeadline = pick(VOCABULARY.headlines.disaster);
            break;
        default:
            return event.eventName; // Fallback
    }

    // Replace placeholders dynamically
    return `${company} ${baseHeadline.replace('{sector}', sectorContext)} ${event.eventName}.`;
};

const generateFullText = (event: ActiveEvent): string => {
    const company = getCompanyName(event);
    const sector = getSectorName(event);
    const articleParts = [];

    // Ensure variety in picked paragraphs
    const pickedOpeners = new Set<string>();
    const pickedDetails = new Set<string>();
    const pickedMarketContexts = new Set<string>();
    const pickedOutlooks = new Set<string>();
    const pickedQuotes = new Set<string>();

    const safePick = (pool: string[], pickedSet: Set<string>): string => {
        const available = pool.filter(item => !pickedSet.has(item));
        if (available.length === 0) return pick(pool); // If all picked, allow repetition
        const selected = pick(available);
        pickedSet.add(selected);
        return selected;
    };

    let opener: string;
    let detail1: string;
    let detail2: string; 
    let detail3: string; // Added a third detail paragraph
    let quote1: string;
    let quote2: string; // Added a second quote
    let marketContext1: string;
    let marketContext2: string; 
    let outlook1: string;
    let outlook2: string; 

    // Determine content based on event type
    // FIX: Corrected a type error where `event.impact` (which can be an object)
    // was being compared to a number. Added a `typeof` check to ensure the
    // comparison only happens when `event.impact` is a number.
    const eventIsPositive = typeof event.impact === 'number' ? event.impact >= 1 : event.type === 'positive';

    switch (event.type) {
        case 'positive':
        case 'split':
            opener = safePick(VOCABULARY.openers.positive, pickedOpeners).replace('{company}', company);
            detail1 = safePick(VOCABULARY.details.positive, pickedDetails);
            detail2 = safePick(VOCABULARY.details.positive, pickedDetails); 
            detail3 = safePick(VOCABULARY.details.positive, pickedDetails);
            quote1 = safePick(VOCABULARY.analyst_quotes.positive, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            quote2 = safePick(VOCABULARY.analyst_quotes.positive, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            marketContext1 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            marketContext2 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            outlook1 = safePick(VOCABULARY.outlooks.positive, pickedOutlooks);
            outlook2 = safePick(VOCABULARY.outlooks.positive, pickedOutlooks);
            break;
        case 'negative':
            opener = safePick(VOCABULARY.openers.negative, pickedOpeners).replace('{company}', company);
            detail1 = safePick(VOCABULARY.details.negative, pickedDetails);
            detail2 = safePick(VOCABULARY.details.negative, pickedDetails); 
            detail3 = safePick(VOCABULARY.details.negative, pickedDetails);
            quote1 = safePick(VOCABULARY.analyst_quotes.negative, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            quote2 = safePick(VOCABULARY.analyst_quotes.negative, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            marketContext1 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            marketContext2 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            outlook1 = safePick(VOCABULARY.outlooks.negative, pickedOutlooks);
            outlook2 = safePick(VOCABULARY.outlooks.negative, pickedOutlooks);
            break;
        case 'political':
            opener = safePick(eventIsPositive ? VOCABULARY.openers.positive : VOCABULARY.openers.negative, pickedOpeners).replace('{company}', company);
            detail1 = safePick(VOCABULARY.details.political, pickedDetails);
            detail2 = safePick(eventIsPositive ? VOCABULARY.details.positive : VOCABULARY.details.negative, pickedDetails);
            detail3 = safePick(VOCABULARY.details.political, pickedDetails);
            quote1 = safePick(eventIsPositive ? VOCABULARY.analyst_quotes.positive : VOCABULARY.analyst_quotes.negative, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            quote2 = safePick(VOCABULARY.analyst_quotes.negative, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            marketContext1 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            marketContext2 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            outlook1 = safePick(eventIsPositive ? VOCABULARY.outlooks.positive : VOCABULARY.outlooks.negative, pickedOutlooks);
            outlook2 = safePick(VOCABULARY.outlooks.negative, pickedOutlooks);
            break;
        case 'disaster':
            opener = safePick(VOCABULARY.openers.negative, pickedOpeners).replace('{company}', 'Global Markets');
            detail1 = safePick(VOCABULARY.details.disaster, pickedDetails);
            detail2 = safePick(VOCABULARY.details.negative, pickedDetails);
            detail3 = safePick(VOCABULARY.details.disaster, pickedDetails);
            quote1 = safePick(VOCABULARY.analyst_quotes.negative, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            quote2 = safePick(VOCABULARY.analyst_quotes.negative, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            marketContext1 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            marketContext2 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            outlook1 = safePick(VOCABULARY.outlooks.negative, pickedOutlooks);
            outlook2 = safePick(VOCABULARY.outlooks.negative, pickedOutlooks);
            break;
        case 'neutral':
        default: 
            opener = safePick(VOCABULARY.openers.neutral, pickedOpeners).replace('{company}', company);
            detail1 = safePick(VOCABULARY.details.neutral, pickedDetails);
            detail2 = safePick(VOCABULARY.details.neutral, pickedDetails); 
            detail3 = safePick(VOCABULARY.details.neutral, pickedDetails);
            quote1 = safePick(VOCABULARY.analyst_quotes.neutral, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            quote2 = safePick(VOCABULARY.analyst_quotes.neutral, pickedQuotes).replace('{company}', company).replace('{analyst}', safePick(VOCABULARY.analyst_titles, new Set()));
            marketContext1 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            marketContext2 = safePick(VOCABULARY.market_context, pickedMarketContexts).replace('{sector}', sector);
            outlook1 = safePick(VOCABULARY.outlooks.neutral, pickedOutlooks);
            outlook2 = safePick(VOCABULARY.outlooks.neutral, pickedOutlooks);
            break;
    }
    
    // Assemble the article, ensuring at least 300 words
    // We will build it up, adding more paragraphs until we hit the word count
    articleParts.push(`${opener} ${event.description}.`);
    articleParts.push(detail1);
    
    if (detail2 && detail2 !== detail1) articleParts.push(detail2); 
    if (detail3 && detail3 !== detail1 && detail3 !== detail2) articleParts.push(detail3); // Add third detail

    articleParts.push(marketContext1); // Add a specific market context
    if (marketContext2 && marketContext2 !== marketContext1) articleParts.push(marketContext2); // Add another if different

    // Add analyst quotes, ensuring variety
    if (Math.random() < 0.9) { // High chance to include at least one quote
        articleParts.push(quote1);
        if (Math.random() < 0.4 && quote2 && quote2 !== quote1) { // 40% chance for a second quote
            articleParts.push(quote2);
        }
    }
    
    articleParts.push(outlook1);
    if (outlook2 && outlook2 !== outlook1) articleParts.push(outlook2); // Add another outlook if different

    return articleParts.join('\n\n');
}


/**
 * Simulates a "neural network" for news generation by assembling an article
 * from pre-defined templates and vocabulary pools, tailored to the event.
 * Returns a complete article object with headline, summary, and full text.
 */
export const generateNewsArticle = (event: ActiveEvent): { headline: string; summary: string; fullText: string } => {
    const headline = generateHeadline(event);
    const fullText = generateFullText(event);
    // Use a summary from the vocabulary for card views
    let summary: string;
    switch (event.type) {
        case 'positive': summary = pick(VOCABULARY.summaries.positive); break;
        case 'negative': summary = pick(VOCABULARY.summaries.negative); break;
        case 'neutral': summary = pick(VOCABULARY.summaries.neutral); break;
        case 'split': summary = pick(VOCABULARY.summaries.split); break;
        case 'political': summary = pick(VOCABULARY.summaries.political); break;
        case 'disaster': summary = pick(VOCABULARY.summaries.disaster); break;
        default: summary = event.description; break;
    }

    return { headline, summary, fullText };
};
