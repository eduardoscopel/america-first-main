export const predictScores = (players, week, leagueData) => {
    const starterPositions = getStarterPositions(leagueData);
    const year = parseInt(leagueData.season);

    // sort roster by highest projected points for that week
    const projectedPlayers = [...players].sort((a, b) => (b.wi[year] && b.wi[year][week] ? b.wi[year][week].p : 0) - (a.wi[year] && a.wi[year][week] ? a.wi[year][week].p : 0));

    // now that the players are sorted, grab the QBs
    const qbs = projectedPlayers.filter(p => p.pos == 'QB');
    // and the WRs
    const wrs = projectedPlayers.filter(p => p.pos == 'WR');
    // and the RBs
    const rbs = projectedPlayers.filter(p => p.pos == 'RB');
    // and the TEs
    const tes = projectedPlayers.filter(p => p.pos == 'TE');
    // and the DEFs
    const defs = projectedPlayers.filter(p => p.pos == 'DEF');
    // and the Ks
    const ks = projectedPlayers.filter(p => p.pos == 'K');
    // and the DLs
    const dls = projectedPlayers.filter(p => p.pos == 'DL');
    // and the LBs
    const lbs = projectedPlayers.filter(p => p.pos == 'LB');
    // and the DBs
    const dbs = projectedPlayers.filter(p => p.pos == 'DB');

    let powerScore = 0;
    // next, use the roster configuration to grab the highest scorer at each position
    for(const starterPosition of starterPositions) {
        const qb = parseFloat(qbs[0]?.wi[year] && qbs[0]?.wi[year][week] ? qbs[0].wi[year][week].p : 0);
        const rb = parseFloat(rbs[0]?.wi[year] && rbs[0]?.wi[year][week] ? rbs[0].wi[year][week].p : 0);
        const wr = parseFloat(wrs[0]?.wi[year] && wrs[0]?.wi[year][week] ? wrs[0].wi[year][week].p : 0);
        const te = parseFloat(tes[0]?.wi[year] && tes[0]?.wi[year][week] ? tes[0].wi[year][week].p : 0);
        const dl = parseFloat(dls[0]?.wi[year] && dls[0]?.wi[year][week] ? dls[0].wi[year][week].p : 0);
        const lb = parseFloat(lbs[0]?.wi[year] && lbs[0]?.wi[year][week] ? lbs[0].wi[year][week].p : 0);
        const db = parseFloat(dbs[0]?.wi[year] && dbs[0]?.wi[year][week] ? dbs[0].wi[year][week].p : 0);
        const k = parseFloat(ks[0]?.wi[year] && ks[0]?.wi[year][week] ? ks[0].wi[year][week].p : 0);
        const def = parseFloat(defs[0]?.wi[year] && defs[0]?.wi[year][week] ? defs[0].wi[year][week].p : 0);
        switch (starterPosition) {
            case 'QB':
                qbs.shift();
                powerScore += qb;
                break;
            case 'RB':
                rbs.shift();
                powerScore += rb;
                break;
            case 'WR':
                wrs.shift()
                powerScore += wr;
                break;
            case 'TE':
                tes.shift();
                powerScore += te;
                break;
            case 'DEF':
                defs.shift();
                powerScore += def;
                break;
            case 'K':
                ks.shift();
                powerScore += k;
                break;
            case 'DL':
                dls.shift();
                powerScore += dl;
                break;
            case 'LB':
                lbs.shift();
                powerScore += lb;
                break;
            case 'DB':
                dbs.shift();
                powerScore += db;
                break;
            // Start of flex players
            case 'FLEX':
                if(rb >= wr && rb >= te) {
                    rbs.shift();
                    powerScore += rb;
                } else if (wr >= rb && wr >= te) {
                    wrs.shift();
                    powerScore += wr;
                } else {
                    tes.shift();
                    powerScore += te;
                }
                break;
            case 'WRRB_FLEX':
                if(rb >= wr) {
                    rbs.shift();
                    powerScore += rb;
                } else {
                    wrs.shift();
                    powerScore += wr;
                }
                break;
            case 'SUPER_FLEX':
                if(qb >= wr && qb >= te && qb >= rb) {
                    qbs.shift();
                    powerScore += qb;
                } else if (rb >= wr && rb >= te && rb >= qb) {
                    rbs.shift();
                    powerScore += rb;
                } else if (wr >= rb && wr >= te && wr >= qb) {
                    wrs.shift();
                    powerScore += wr;
                } else {
                    tes.shift();
                    powerScore += te;
                }
                break;
            case 'IDP':
                if(dl >= lb && dl >= db) {
                    dls.shift();
                    powerScore += dl;
                } else if (lb >= dl && lb >= db) {
                    lbs.shift();
                    powerScore += lb;
                } else {
                    dbs.shift();
                    powerScore += db;
                }
                break;
            default:
                break;
        }
    }
    return powerScore;
}

export const getStarterPositions = (leagueData) => {
    const rosterPositions = leagueData.roster_positions;
    const firstBench = rosterPositions.indexOf('BN');

    return rosterPositions.slice(0, firstBench);
}