/**
 * Calculate match score based on extracted resume and JD data
 * @param {Object} resumeData 
 * @param {Object} jdData 
 * @param {number} cosineSimilarity 
 */
function calculateMatchScore(resumeData, jdData, cosineSimilarity = 0) {
    const breakdown = {
        skills: { score: 0, max: 35, detail: "" },
        experience: { score: 0, max: 25, detail: "" },
        relevance: { score: 0, max: 25, detail: "" },
        education: { score: 0, max: 10, detail: "" },
        location: { score: 0, max: 5, detail: "" }
    };

    // 1. Skills (35pts)
    const resSkills = [...new Set([
        ...(resumeData.skills || []),
        ...(resumeData.skills?.length === 0 ? (resumeData.legacySkills || []) : [])
    ])].map(s => s.toLowerCase());

    const reqSkills = [...new Set([
        ...(jdData.required_skills || []),
        ...(jdData.required_skills?.length === 0 ? (jdData.skills || jdData.legacySkills || []) : [])
    ])].map(s => s.toLowerCase());
    
    const prefSkills = (jdData.preferred_skills || []).map(s => s.toLowerCase());
    const allResumeSkillsStr = resSkills.join(' ');

    let requiredMatches = 0;
    reqSkills.forEach(skill => {
        // Fuzzy match: check if skill is in any resume skill or resume skill is in skill
        const isMatch = resSkills.some(rs => rs.includes(skill) || skill.includes(rs));
        if (isMatch) requiredMatches++;
    });

    let preferredMatches = 0;
    prefSkills.forEach(skill => {
        const isMatch = resSkills.some(rs => rs.includes(skill) || skill.includes(rs));
        if (isMatch) preferredMatches++;
    });

    const requiredScore = Math.min(25, requiredMatches * 2.5);
    const preferredScore = Math.min(10, preferredMatches * 1.0);
    breakdown.skills.score = requiredScore + preferredScore;
    breakdown.skills.detail = `${requiredMatches}/${reqSkills.length} required, ${preferredMatches}/${prefSkills.length} preferred`;

    // 2. Experience (25pts)
    const resumeExp = resumeData.years_experience || 0;
    const minExp = jdData.min_years_experience || 0;
    if (resumeExp >= minExp) {
        breakdown.experience.score = 25;
    } else if (resumeExp >= minExp - 1) {
        breakdown.experience.score = 15;
    } else if (resumeExp >= minExp - 2) {
        breakdown.experience.score = 8;
    } else {
        breakdown.experience.score = 0;
    }
    breakdown.experience.detail = `${resumeExp} yrs vs ${minExp} yrs required`;

    // 3. Relevance (25pts)
    breakdown.relevance.score = Math.round(cosineSimilarity * 25);
    breakdown.relevance.detail = `Semantic similarity: ${(cosineSimilarity * 100).toFixed(1)}%`;

    // 4. Education (10pts)
    const eduReq = (jdData.education_requirement || 'none').toLowerCase();
    const candidateEdu = (resumeData.education || []).map(e => (e.degree || '').toLowerCase());
    
    const eduLevels = { 'phd': 4, 'masters': 3, 'bachelors': 2, 'b.tech': 2, 'any_degree': 1, 'none': 0 };
    const reqLevel = eduLevels[eduReq] || 0;
    
    let candidateLevel = 0;
    candidateEdu.forEach(deg => {
        if (deg.includes('phd') || deg.includes('doctorate')) candidateLevel = Math.max(candidateLevel, 4);
        else if (deg.includes('master') || deg.includes('mba') || deg.includes('m.tech') || deg.includes('m.sc')) candidateLevel = Math.max(candidateLevel, 3);
        else if (deg.includes('bachelor') || deg.includes('b.tech') || deg.includes('b.sc') || deg.includes('b.a') || deg.includes('degree')) candidateLevel = Math.max(candidateLevel, 2);
    });

    if (eduReq === 'none') {
        breakdown.education.score = 10;
    } else if (candidateLevel >= reqLevel) {
        if (candidateLevel === 4) breakdown.education.score = 10;
        else if (candidateLevel === 3) breakdown.education.score = 8;
        else breakdown.education.score = 7;
    } else if (reqLevel === 1 && candidateLevel >= 1) {
        breakdown.education.score = 5;
    } else {
        breakdown.education.score = 0;
    }
    breakdown.education.detail = `${resumeData.education?.[0]?.degree || 'No degree'} vs ${eduReq} required`;

    // 5. Location (5pts)
    const resLoc = (resumeData.location || '').toLowerCase();
    const jdLoc = (jdData.location || '').toLowerCase();
    if (resLoc.includes(jdLoc) || jdLoc.includes(resLoc) || resLoc.includes('remote') || jdLoc.includes('remote')) {
        breakdown.location.score = 5;
        breakdown.location.detail = "Location match or remote flexible";
    } else {
        breakdown.location.score = 0;
        breakdown.location.detail = `Candidate: ${resumeData.location}, Job: ${jdData.location}`;
    }

    const overall = Math.round(
        breakdown.skills.score + 
        breakdown.experience.score + 
        breakdown.relevance.score + 
        breakdown.education.score + 
        breakdown.location.score
    );

    return {
        overall: Math.min(100, overall),
        breakdown
    };
}

module.exports = { calculateMatchScore };
