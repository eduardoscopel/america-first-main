<script>
    import { getPlayByPlay, waitForAll, round } from '$lib/utils/helper'; 
import { run } from 'svelte/internal';

    export let nflTeams, nflMatchups, leagueData, fantasyStarters, managerInfo, playersInfo, gameSelection, fantasyProducts;

    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/situation?lang=en&region=us CURRENT DOWN
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/plays?lang=en&region=us PLAY BY PLAY
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/competitors/22/statistics?lang=en&region=us GAME STATS
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436?lang=en&region=us GAME
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks ALL WEEKS
    // 4035687
    let startersArray = [];

    export const loadPlayByPlay = async (gameSelection, startersArray) => {
        let playByPlayData = await getPlayByPlay(gameSelection, true).catch((err) => { console.error(err); });
        // set key to number of API pages for the full PBP
        let recencyKey = playByPlayData.length;
        let fantasyRelevantPlaysForward = [];
        let defYdsThreshBreakers = [];
        // startersArray will help us match our sleeper playerInfo to espn player APIs, and also check if someone is starting one of the DEFs
        startersArray = [];
        for(const recordManID in fantasyStarters) {
            const starters = fantasyStarters[recordManID];

            for(const starter of starters) {
                if(starter != '0') {
                    const starterInfo = playersInfo.players[starter];
                    const starterEntry = {
                        playerID: starter,
                        owner: managerInfo[recordManID],
                        fn: starterInfo.fn,
                        ln: starterInfo.ln,
                        pos: starterInfo.pos,
                        t: starterInfo.t,
                        avatar: starterInfo.pos == "DEF" ? `https://sleepercdn.com/images/team_logos/nfl/${starter.toLowerCase()}.png` : `https://sleepercdn.com/content/nfl/players/thumb/${starter}.jpg`,
                    }
                    startersArray.push(starterEntry);
                }
            }
        }
        // identify NFL teams in the current game
        let game = nflMatchups.filter(m => m[0].gameID == gameSelection)[0];
        let home = game[0].sleeperID;
        let away = game[1].sleeperID;
        let homeDefPtsAllowed = 0;
        let awayDefPtsAllowed = 0;
        let homeDefYdsAllowed = 0;
        let awayDefYdsAllowed = 0;
        const score = leagueData.scoring_settings;
        // start with first page
        for(let j = 0; j < recencyKey; j++) {
            let playsData = playByPlayData[j].items;
            // start with first play on page
            for(let k = 0; k < playsData.length; k++) {
                let play = playsData[k];
                // which team made the play
                let espnTeamID
                if(play.participants && play.participants[0].statistics) {
                    if(play.participants[0].statistics.$ref.slice(115, 117)[1] != '/') {
                        espnTeamID = play.participants[0].statistics.$ref.slice(115, 117);
                    } else {
                        espnTeamID = play.participants[0].statistics.$ref.slice(115, 116);
                    }
                } else {
                    if(play.team.$ref.slice(82, 84)[1] != '?') {
                        espnTeamID = play.team.$ref.slice(82, 84);
                    } else {
                        espnTeamID = play.team.$ref.slice(82, 83);
                    }
                }
                let playTeam;
                for(const key in nflTeams) {
                    if(nflTeams[key].espnID == espnTeamID) {
                        playTeam = key;
                        break;
                    }
                }
                // flagging penalty-negated plays
                let noPlay = new Boolean (false);
                if(play.alternativeText.includes('No Play.')) {
                    noPlay = true;
                } else {
                    noPlay = false;
                }
                // flagging scoring plays & tracking DEF points allowed
                let scoringPlay = new Boolean (false);
                let scoreAgainstDEF = new Boolean (false);
                let scoringType;
                let scoreValue;
                if(play.scoreValue > 0) {
                    scoringPlay = true;
                    scoringType = play.scoringType.name;
                    if(play.scoreValue == 6 && (play.alternativeText.includes('extra point is GOOD') || play.alternativeText.includes('Kick)'))) {
                        scoreValue = 7;
                    } else {
                        scoreValue = play.scoreValue;
                    }
                    if(play.type.id == 36) { // TO-DO add fumble ret tds and other non-def-scoring plays
                        scoreAgainstDEF = false;
                    } else {
                        scoreAgainstDEF = true;
                        if(playTeam == home) {
                            awayDefPtsAllowed += scoreValue;
                        } else {
                            homeDefPtsAllowed += scoreValue;
                        }
                    }
                } else {
                    scoringPlay = false;
                    scoringType = null;
                    scoreValue = 0;
                    scoreAgainstDEF = false;
                }
                // the play object with all necessary info
                const playEntry = {
                    playID: play.id,
                    order: play.sequenceNumber,
                    playType: play.type.id,
                    team: playTeam,
                    description: play.alternativeText,
                    scoringPlay,
                    scoringType,
                    scoreValue,
                    yards: play.statYardage,
                    relevantPlayers: [],
                    relevantDEF: [],
                    scoreAgainstDEF,
                    teamStartPoss: play.start.team?.$ref || null,
                    teamEndPoss: play?.end.team?.$ref || null,
                    noPlay,
                }
                // tracking DEF yards allowed TO-DO account for penalties that didn't negate play
                if(playTeam == home && startersArray.filter(s => s.playerID == away).length > 0 
                   && (play.type.id == 5 || play.type.id == 7 || play.type.id == 24 || play.type.id == 67 || play.type.id == 68 || (play.type.id == 52 && score.def_pr_yd) || (play.type.id == 53 && score.def_kr_yd))
                   && noPlay == false) {

                    let oldYA = awayDefYdsAllowed;
                    awayDefYdsAllowed += play.statYardage;
                    // check if threshold broken
                    if((oldYA < 100 && awayDefYdsAllowed >= 100) || (oldYA < 200 && awayDefYdsAllowed >= 200) || (oldYA < 300 && awayDefYdsAllowed >= 300) || (oldYA < 350 && awayDefYdsAllowed >= 350) ||
                      (oldYA < 400 && awayDefYdsAllowed >= 400) || (oldYA < 450 && awayDefYdsAllowed >= 450) || (oldYA < 500 && awayDefYdsAllowed >= 500) || (oldYA < 550 && awayDefYdsAllowed >= 550)) {
                        defYdsThreshBreakers.push({
                            old: oldYA,
                            new: awayDefYdsAllowed,
                            playInfo: playEntry,
                            defense: away,
                        });
                    }

                    if(startersArray.filter(s => s.playerID == home).length > 0 && ((play.type.id == 52 && score.def_pr_yd) || (play.type.id == 53 && score.def_kr_yd))) {
                        let oldYA = homeDefYdsAllowed;
                        homeDefYdsAllowed = homeDefYdsAllowed - play.statYardage;
                        // check if threshold broken
                        if((homeDefYdsAllowed < 100 && oldYA >= 100) || (homeDefYdsAllowed < 200 && oldYA >= 200) || (homeDefYdsAllowed < 300 && oldYA >= 300) || (homeDefYdsAllowed < 350 && oldYA >= 350) ||
                            (homeDefYdsAllowed < 400 && oldYA >= 400) || (homeDefYdsAllowed < 450 && oldYA >= 450) || (homeDefYdsAllowed < 500 && oldYA >= 500) || (homeDefYdsAllowed < 550 && oldYA >= 550)) {
                            defYdsThreshBreakers.push({
                                old: oldYA,
                                new: homeDefYdsAllowed,
                                playInfo: playEntry,
                                defense: home,
                            });
                        }
                    }
                } else if(playTeam == away && startersArray.filter(s => s.playerID == home).length > 0
                          && (play.type.id == 5 || play.type.id == 7 || play.type.id == 24 || play.type.id == 67 || play.type.id == 68 || (play.type.id == 52 && score.def_pr_yd) || (play.type.id == 53 && score.def_kr_yd))
                          && noPlay == false) {
                            
                            let oldYA = homeDefYdsAllowed;  
                            homeDefYdsAllowed += play.statYardage;
                            // check if threshold broken
                            if((oldYA < 100 && homeDefYdsAllowed >= 100) || (oldYA < 200 && homeDefYdsAllowed >= 200) || (oldYA < 300 && homeDefYdsAllowed >= 300) || (oldYA < 350 && homeDefYdsAllowed >= 350) ||
                               (oldYA < 400 && homeDefYdsAllowed >= 400) || (oldYA < 450 && homeDefYdsAllowed >= 450) || (oldYA < 500 && homeDefYdsAllowed >= 500) || (oldYA < 550 && homeDefYdsAllowed >= 550)) {
                                defYdsThreshBreakers.push({
                                    old: oldYA,
                                    new: homeDefYdsAllowed,
                                    playInfo: playEntry,
                                    defense: home,
                                });
                            }
                            if(startersArray.filter(s => s.playerID == away).length > 0 && ((play.type.id == 52 && score.def_pr_yd) || (play.type.id == 53 && score.def_kr_yd))) {
                                let oldYA = awayDefYdsAllowed;
                                awayDefYdsAllowed = awayDefYdsAllowed - play.statYardage;
                                // check if threshold broken
                                if((awayDefYdsAllowed < 100 && oldYA >= 100) || (awayDefYdsAllowed < 200 && oldYA >= 200) || (awayDefYdsAllowed < 300 && oldYA >= 300) || (awayDefYdsAllowed < 350 && oldYA >= 350) ||
                                   (awayDefYdsAllowed < 400 && oldYA >= 400) || (awayDefYdsAllowed < 450 && oldYA >= 450) || (awayDefYdsAllowed < 500 && oldYA >= 500) || (awayDefYdsAllowed < 550 && oldYA >= 550)) {
                                    defYdsThreshBreakers.push({
                                        old: oldYA,
                                        new: homeDefYdsAllowed,
                                        playInfo: playEntry,
                                        defense: away,
                                    });
                                }
                            }
                }

                // some "plays" in API don't have participants (ex. coin-toss)
                if(play.participants) {
                    // loop thru every player involved in play
                    for(const playerKey in play.participants) {
                        // ESPN PBP API includes direct links to player APIs
                        const espnPlayerLink = 'https' + play.participants[playerKey].athlete.$ref.slice(4); 
                        const playerPromises = [];
                        playerPromises.push(fetch(`${espnPlayerLink}`, {compress: true}));
                        const playersRes = await waitForAll(...playerPromises).catch((err) => { console.error(err); });
                
                        const playerJsonPromises = [];
                        for(const playerRes of playersRes) {
                            const data = playerRes.json();
                            playerJsonPromises.push(data)
                            if (!playerRes.ok) {
                                throw new Error(data);
                            }
                        }
                        const espnPlayerData = await waitForAll(...playerJsonPromises).catch((err) => { console.error(err); });
                        // which team is player on
                        let espnPlayerTeamID
                        if(espnPlayerData[0].team.$ref.slice(82, 84)[1] != '?') {
                            espnPlayerTeamID = espnPlayerData[0].team.$ref.slice(82, 84);
                        } else {
                            espnPlayerTeamID = espnPlayerData[0].team.$ref.slice(82, 83);
                        }
                        let playerTeam;
                        for(const key in nflTeams) {
                            if(nflTeams[key].espnID == espnPlayerTeamID) {
                                playerTeam = key;
                            }
                        }
                        // full name & position should be enough identifying info to match our sleeper info to espn's player API
                        const espnMatch = {
                            fn: espnPlayerData[0].firstName,
                            ln: espnPlayerData[0].lastName,
                            pos: espnPlayerData[0].position.abbreviation,
                        }
                        // Catching exceptions with different names
                        if(espnMatch.fn == 'Michael' && espnMatch.ln == 'Pittman Jr.' && espnMatch.pos == 'WR') {
                            espnMatch.ln = 'Pittman';
                        }
                        let sleeperMatch = startersArray.filter(s => s.fn == espnMatch.fn && s.ln == espnMatch.ln && s.pos == espnMatch.pos);
                        // if the current player involved in the play is a starter, we combine the sleeper and espn info for their entry in the playEntry
                        if(sleeperMatch.length > 0) {
                            const relevantEntry = {
                                playerInfo: sleeperMatch[0],
                                manager: sleeperMatch[0].owner,
                                statType: play.participants[playerKey].type,
                                yards: play.statYardage, 
                                playType: play.type.id,
                                playerTeam,
                                oppDef: null,
                            }
                            // assigning the opposing DEF here makes it easier to calculate DEF fantasy points later
                            if(sleeperMatch[0].t == home) {
                                relevantEntry.oppDef = away;
                            } else {
                                relevantEntry.oppDef = home;
                            }
                            playEntry.relevantPlayers.push(relevantEntry);
                        } 
                        // flagging DEF-relevant plays
                        if((startersArray.filter(s => s.playerID == home).length > 0 ||  // someone started a DEF
                            startersArray.filter(s => s.playerID == away).length > 0)
                            && (play.type.id == 7 || play.type.id == 9 || play.type.id == 26 ||     // play was of a defensive type
                                play.type.id == 36 || play.type.id == 52 || play.type.id == 53 ||   // TO-DO need to be able to catch yardage threshold breaks
                                play.type.id == 32 || (play.type.id == 60 && play.alternativeText.includes('BLOCKED')))
                            && noPlay == false) {                                                       // no penalty
                            if(startersArray.filter(s => s.playerID == away).length > 0 && playTeam == home) {
                                const defense = startersArray.filter(s => s.playerID == away)[0];
                                const relevantEntry = {
                                    playerInfo: defense,
                                    manager: defense.owner,
                                    statType: play.participants[playerKey].type,
                                    yards: play.statYardage, 
                                    playType: play.type.id,
                                    oppDef: away,
                                }
                                playEntry.relevantDEF.push(relevantEntry);
                            } else if(startersArray.filter(s => s.playerID == home).length > 0 && playTeam == away) {
                                const defense = startersArray.filter(s => s.playerID == home)[0];
                                const relevantEntry = {
                                    playerInfo: defense,
                                    manager: defense.owner,
                                    statType: play.participants[playerKey].type,
                                    yards: play.statYardage, 
                                    playType: play.type.id,
                                    oppDef: home,
                                }
                                playEntry.relevantDEF.push(relevantEntry);
                            }
                        }
                    }
                    // only push on plays involving starters, and not called back for penalty (deal with those separately)
                    if(noPlay == false && (playEntry.relevantPlayers.length > 0 || playEntry.relevantDEF.length >  0 || playEntry.scoringPlay == true)) {
                        fantasyRelevantPlaysForward.push(playEntry);
                    } 
                }
            }
        }
        
        // now that we've filtered our relevant plays, we calculate the fpts each produced
        let fantasyProducts = [];
        let fantasyPlay = {};
        const runningTotals = {};
        const pushRunningTotal = (fpts, statDesc, stat, metric, playerID, position) => {
            if(!runningTotals[playerID]) {
                runningTotals[playerID] = {
                    stats: {},
                    totalFpts: fpts,
                    filter: 'password',
                    pos: position,
                }
            } else {
                runningTotals[playerID].totalFpts += fpts;
            }
            if(!runningTotals[playerID].stats[statDesc]) {
                runningTotals[playerID].stats[statDesc] = {
                    fpts: fpts,
                    occurs: 1,
                    metric: metric,
                    stat,
                    statDesc,
                }
            } else {
                runningTotals[playerID].stats[statDesc].fpts += fpts;
                runningTotals[playerID].stats[statDesc].occurs ++;
                if(statDesc != 'PTS ALW:' && statDesc != 'YDS ALW:') {
                    runningTotals[playerID].stats[statDesc].metric += metric;
                } else {
                    if(runningTotals[playerID].stats[statDesc].metric < metric) {
                        runningTotals[playerID].stats[statDesc].metric = metric;
                    }
                }
            }
           
            let runningTotal = runningTotals[playerID].stats[statDesc];
            return runningTotal;
        }
        // const espnScoringIDs = {        // currently only used for reference while coding - 
        //     2: 'end period',               these specific IDs make it easier to isolate 
        //     3: 'incomplete pass',          which stats are earning fpts
        //     5: 'rush',
        //     7: 'sack',
        //     8: 'penalty',
        //     9: 'fumble offense recovery',
        //     12: 'kickoff return offense', onside kick?
        //     21: 'timeout',
        //     24: 'completed pass',
        //     26: 'interception',
        //     32: 'kick six'
        //     36: 'pick six',
        //     52: 'punt',
        //     53: 'kickoff',
        //     59: 'FG good',
        //     60: 'FG miss'
        //     66: 'end game',
        //     67: 'pass TD', 
        //     68: 'rush TD',
        //     70: 'coin toss',
        //     75: '2-min warning',
        // }
        const calculateDefPointsAllowed = (teamScore) => {
            let DEFscore = 0;
            let DEFthreshold;
            let DEFdescription;
            if(score.pts_allow) {
                DEFscore += teamScore * score.pts_allow;
            } 
            if(teamScore == 0) {
                DEFscore += (score?.pts_allow_0 || 0);
                DEFthreshold = 'pts_allow_0';
                DEFdescription = 'Zero Points Allowed';
            } else if(teamScore > 0 && teamScore < 7) {
                DEFscore += (score?.pts_allow_1_6 || 0);
                DEFthreshold = 'pts_allow_1_6';
                DEFdescription = 'Points Allowed (1-6)';
            } else if(teamScore > 6 && teamScore < 14) {
                DEFscore += (score?.pts_allow_7_13 || 0);
                DEFthreshold = 'pts_allow_7_13';
                DEFdescription = 'Points Allowed (7-13)';
            } else if(teamScore > 13 && teamScore < 21) {
                DEFscore += (score?.pts_allow_14_20 || 0);
                DEFthreshold = 'pts_allow_14_20';
                DEFdescription = 'Points Allowed (14-20)';
            } else if(teamScore > 20 && teamScore < 28) {
                DEFscore += (score?.pts_allow_21_27 || 0);
                DEFthreshold = 'pts_allow_21_27';
                DEFdescription = 'Points Allowed (21-27)';
            } else if(teamScore > 27 && teamScore < 35) {
                DEFscore += (score?.pts_allow_28_34 || 0);
                DEFthreshold = 'pts_allow_28_34';
                DEFdescription = 'Points Allowed (28-34)';
            } else if(teamScore >= 35) {
                DEFscore += (score?.pts_allow_35p || 0);
                DEFthreshold = 'score.pts_allow_35p';
                DEFdescription = 'Points Allowed (35+)';
            }
            return {DEFscore, DEFthreshold, DEFdescription};
        }
        const calculateDefYardsAllowed = (teamYards) => {
            let DEFscore = 0;
            let DEFthreshold;
            let DEFdescription;
            if(teamYards >= 0 && teamYards < 100) {
                DEFscore += (score?.yds_allow_0_100 || 0);
                DEFthreshold = 'yds_allow_0_100';
                DEFdescription = 'Yards Allowed (0-99)';
            } else if(teamYards >= 100 && teamYards < 200) {
                DEFscore += (score?.yds_allow_100_199 || 0);
                DEFthreshold = 'yds_allow_100_199';
                DEFdescription = 'Yards Allowed (100-199)';
            } else if(teamYards >= 200 && teamYards < 300) {
                DEFscore += (score?.yds_allow_200_299 || 0);
                DEFthreshold = 'yds_allow_200_299';
                DEFdescription = 'Yards Allowed (200-299)';
            } else if(teamYards >= 300 && teamYards < 350) {
                DEFscore += (score?.yds_allow_300_349 || 0);
                DEFthreshold = 'yds_allow_300_349';
                DEFdescription = 'Yards Allowed (300-349)';
            } else if(teamYards >= 350 && teamYards < 400) {
                DEFscore += (score?.yds_allow_350_399 || 0);
                DEFthreshold = 'yds_allow_350_399';
                DEFdescription = 'Yards Allowed (350-399)';
            } else if(teamYards >= 400 && teamYards < 450) {
                DEFscore += (score?.yds_allow_400_449 || 0);
                DEFthreshold = 'yds_allow_400_449';
                DEFdescription = 'Yards Allowed (400-449)';
            } else if(teamYards >= 450 && teamYards < 500) {
                DEFscore += (score?.yds_allow_450_499 || 0);
                DEFthreshold = 'yds_allow_450_499';
                DEFdescription = 'Yards Allowed (450-499)';
            } else if(teamYards >= 500 && teamYards < 550) {
                DEFscore += (score?.yds_allow_500_549 || 0);
                DEFthreshold = 'yds_allow_500_549';
                DEFdescription = 'Yards Allowed (500-549)';
            } else if(teamYards >= 550) {
                DEFscore += (score?.yds_allow_550p || 0);
                DEFthreshold = 'yds_allow_550p';
                DEFdescription = 'Yards Allowed (550+)';
            }
            if(score.yds_allow) {
                DEFscore += teamYards * score.yds_allow;
                let DEFdesc1 = 'Yards Allowed (';
                let DEFdesc2 = teamYards.toString();
                let DEFdesc3 = ');'
                DEFdescription = DEFdesc1 + DEFdesc2 + DEFdesc3;
            } 
            return {DEFscore, DEFthreshold, DEFdescription};
        }

        let fantasyRelevantPlays = fantasyRelevantPlaysForward.slice().reverse();
        for(const playKey in fantasyRelevantPlays) {
            const play = fantasyRelevantPlays[playKey];
            // create play-array to group fpts by multiple players in one play
            if(!fantasyPlay[play.playID]) {
                fantasyPlay[play.playID] = [];
            }
            // TO-DO: other non-defensive-score-hurting touchdowns                                      TEAM DEF POINTS ALLOWED
            if(play.scoreAgainstDEF == true && (startersArray.filter(s => s.playerID == home).length > 0 || startersArray.filter(s => s.playerID == away).length > 0)) {
                if(play.team == home && startersArray.filter(s => s.playerID == away).length > 0) {
                    let oldAwayDefPtsAllowed = awayDefPtsAllowed - play.scoreValue;
                    let curDEFscore = calculateDefPointsAllowed(awayDefPtsAllowed);
                    let oldDEFscore = calculateDefPointsAllowed(oldAwayDefPtsAllowed);
                    const defense = startersArray.filter(s => s.playerID == away)[0];
                    const fpts = curDEFscore.DEFscore - oldDEFscore.DEFscore;
                    const statPTS = 'PTS ALW:';
                    const entryDEF = {
                        order: play.order,
                        side: 'defense',
                        manager: defense.owner,
                        playerInfo: defense,
                        stat: [curDEFscore.DEFthreshold],
                        runningTotals: [],
                        fpts,
                        description: play.description,
                        shortDesc: curDEFscore.DEFdescription,
                    }   
                    if(score.pts_allow) {
                        entryDEF.stat.push('pts_allow');
                    } 
                    if(fpts != 0) {
                        let runningTotal = pushRunningTotal(fpts, statPTS, curDEFscore.DEFthreshold, awayDefPtsAllowed, defense.playerID, defense.pos); 
                        entryDEF.runningTotals.push(runningTotal);
                        fantasyPlay[play.playID].push(entryDEF);
                    }
                    awayDefPtsAllowed = oldAwayDefPtsAllowed;
                } else if(play.team == away && startersArray.filter(s => s.playerID == home).length > 0) {
                    let oldHomeDefPtsAllowed = homeDefPtsAllowed - play.scoreValue;
                    let curDEFscore = calculateDefPointsAllowed(homeDefPtsAllowed);
                    let oldDEFscore = calculateDefPointsAllowed(oldHomeDefPtsAllowed);
                    const defense = startersArray.filter(s => s.playerID == home)[0];
                    const fpts = curDEFscore.DEFscore - oldDEFscore.DEFscore;
                    const statPTS = 'PTS ALW:';
                    const entryDEF = {
                        order: play.order,
                        side: 'defense',
                        manager: defense.owner,
                        playerInfo: defense,
                        stat: [curDEFscore.DEFthreshold],
                        runningTotals: [],
                        fpts,
                        description: play.description,
                        shortDesc: curDEFscore.DEFdescription,
                    }   
                    if(score.pts_allow) {
                        entryDEF.stat.push('pts_allow');
                    } 
                    if(fpts != 0) {
                        let runningTotal = pushRunningTotal(fpts, statPTS, curDEFscore.DEFthreshold, homeDefPtsAllowed, defense.playerID, defense.pos); 
                        entryDEF.runningTotals.push(runningTotal);
                        fantasyPlay[play.playID].push(entryDEF);
                    }
                    homeDefPtsAllowed = oldHomeDefPtsAllowed;     
                }
            }
            if(play.relevantDEF.length > 0) {                   // TEAM DEF/ST FPTS
                let sackRecorded = new Boolean (false);
                for(const relevantKey in play.relevantDEF) {
                    const player = play.relevantDEF[relevantKey];
                    if(player.statType == 'recoverer'
                       && player.playType != 9
                       && play.teamStartPoss != play.teamEndPoss) {                    // FUMBLE RECOVERY PTS - TEAM DEF
                            const fpts = (score?.fum_rec || 0);            // NOTE TO-DO: Must distinguish b/t def & st recoveries
                            const statDesc = 'FR:';
                            const entryDEF = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['fum_rec'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Fumble Recovery',
                            }   
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, statDesc, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryDEF.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entryDEF);
                    } 
                    if(player.statType == 'forcedBy') {          // FORCED FUMBLE PTS - TEAM ST
                        if(player.playType == 52 || player.playType == 53 || player.playType == 60) {
                            const fpts = (score?.def_st_ff || 0);
                            const stat = 'FF(ST):';
                            const entryDEF = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['def_st_ff'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Forced Fumble',
                            }
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, stat, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryDEF.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entryDEF);
                        } else {                            // FORCED FUMBLE PTS - TEAM DEF
                            const fpts = (score?.ff || 0); 
                            const stat = 'FF(D):';
                            const entryDEF = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['ff'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Forced Fumble',
                            }
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, stat, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryDEF.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entryDEF);
                        }
                    }
                    if(player.statType == 'sackedBy' && sackRecorded == false) {            // SACK - TEAM DEF
                        const fpts = (score?.sack || 0) + player.yards * (score?.sack_yd || 0);
                        const fptsSack = (score?.sack || 0);
                        const fptsSackYDS = player.yards * (score?.sack_yd || 0);
                        const statSack = 'SACK:';
                        const statSackYDS = 'SACK YDS:';
                        const entryDEF = {
                            order: play.order,
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['sack', 'sack_yd'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Sack',
                        }
                        if(fptsSack != 0) {
                            let runningTotal = pushRunningTotal(fptsSack, statSack, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        if(fptsSackYDS != 0) {
                            let runningTotal = pushRunningTotal(fptsSackYDS, statSackYDS, entryDEF.stat[1], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                        sackRecorded = true;       // so that split-sacks aren't counted twice
                    }
                    if(player.playType == 26 && player.statType == 'returner') {            // INT TEAM DEF
                        const fpts = (score?.int || 0) + player.yards * (score?.int_ret_yd || 0);
                        const fptsINT = (score?.int || 0);
                        const fptsINTyds = player.yards * (score?.int_ret_yd || 0);
                        const statINT = 'INT:';
                        const statINTyds = 'INT YDS:';
                        const entryDEF = {
                            order: play.order,
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['int', 'int_ret_yd'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Interception',
                        }
                        if(fptsINT != 0) {
                            let runningTotal = pushRunningTotal(fptsINT, statINT, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        if(fptsINTyds != 0) {
                            let runningTotal = pushRunningTotal(fptsINTyds, statINTyds, entryDEF.stat[1], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    } 
                    if(player.playType == 36 && player.statType == 'scorer') {        // P6 TEAM DEF
                        const fpts = (score?.def_td || 0) + (score?.int || 0) + player.yards * (score?.int_ret_yd || 0);
                        const fptsINT = (score?.int || 0);
                        const fptsINTyds = player.yards * (score?.int_ret_yd || 0);
                        const fptsDefTD = (score?.def_td || 0);
                        const statINT = 'INT:';
                        const statINTyds = 'INT YDS:';
                        const statDefTD = 'TD(D):';
                        const entryDEF = {
                            order: play.order,
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['def_td', 'int', 'int_ret_yd'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Pick Six',
                        }
                        if(fptsINT != 0) {
                            let runningTotal = pushRunningTotal(fptsINT, statINT, entryDEF.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        if(fptsINTyds != 0) {
                            let runningTotal = pushRunningTotal(fptsINTyds, statINTyds, entryDEF.stat[2], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        if(fptsDefTD != 0) {
                            let runningTotal = pushRunningTotal(fptsDefTD, statDefTD, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    }   
                    if(player.playType == 53 && player.statType == 'returner') {                  // KICKOFF RETURN YDS TEAM DEF/ST
                        const fpts = player.yards * (score?.def_kr_yd || 0);
                        const stat = 'KO YDS:';
                        const entryDEF = {
                            order: play.order,
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['def_kr_yd'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Kickoff Return',
                        }
                        if(fpts != 0) {
                            let runningTotal = pushRunningTotal(fpts, stat, entryDEF.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    }      
                    if(player.playType == 52 && player.statType == 'returner') {                  // PUNT - TEAM DEF/ST
                        const fpts = player.yards * (score?.def_pr_yd || 0) + (score?.def_forced_punts || 0);
                        const fptsPunt = (score?.def_forced_punts || 0);
                        const fptsPuntReturn = player.yards * (score?.def_pr_yd || 0);
                        const statPunt = 'PUNT:';
                        const statPuntReturn = 'PUNT YDS:';
                        const entryDEF = {
                            order: play.order,
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['def_pr_yd', 'def_forced_punt'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Punt',
                        }
                        if(fptsPunt != 0) {
                            let runningTotal = pushRunningTotal(fptsPunt, statPunt, entryDEF.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        if(fptsPuntReturn != 0) {
                            let runningTotal = pushRunningTotal(fptsPuntReturn, statPuntReturn, entryDEF.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    }    
                    if(player.playType == 32 && player.statType == 'returner') {                  // KICK 6 - TEAM DEF/ST
                        const fpts = player.yards * (score?.def_kr_yd || 0) + (score?.def_st_td || 0);
                        const fptsKick = player.yards * (score?.def_kr_yd || 0);
                        const fptsTD = (score?.def_st_td || 0);
                        const statKick = 'KO YDS:';
                        const statTD = 'TD(ST):';
                        const entryDEF = {
                            order: play.order,
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['def_kr_yd', 'def_st_td'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Kick Six',
                        }
                        if(fptsKick != 0) {
                            let runningTotal = pushRunningTotal(fptsKick, statKick, entryDEF.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        if(fptsTD != 0) {
                            let runningTotal = pushRunningTotal(fptsTD, statTD, entryDEF.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    }    
                    if(player.playType == 60 && play.description.includes('BLOCKED')) {                  // BLOCKED FIELD GOAL - TEAM DEF/ST
                        const fpts = (score?.blk_kick || 0);   // TO-DO: add blk kick return yards (ESPN's statYardage norrmally represents kick distance)
                        const stat = 'BLK:';
                        const entryDEF = {
                            order: play.order,
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['blk_kick'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Blocked Field Goal',
                        }
                        if(fpts != 0) {
                            let runningTotal = pushRunningTotal(fpts, stat, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entryDEF.runningTotals.push(runningTotal);
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    }    
                }
            }

            if(play.relevantPlayers.length > 0) {                   // OFFENSIVE & IDP FPTS 
                for(const relevantKey in play.relevantPlayers) {
                    const player = play.relevantPlayers[relevantKey];       // NOTE TO-DO: ACCOUNT FOR PENALTIES (unclear how/when penalties screw with ESPN's yardage value)
                    if(player.statType == 'fumbler') {                  // FUMBLE 
                        const fpts = (score?.fum || 0);             // PENALTY for FUMBLE FORCED
                        const statFF = 'FUM:';
                        const entry = {
                            order: play.order,
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['fum'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Fumble',
                        }       
                        if(fpts != 0) {
                            let runningTotal = pushRunningTotal(fpts, statFF, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }            
                        if(play.teamStartPoss != play.teamEndPoss && score.fum_lost) {      // PENALTY for FUMBLE -> TURNOVER
                            entry.fpts += score.fum_lost;                                   // note that it's not necessarily one or the other
                            entry.stat.push('fum_lost');
                            entry.shortDesc += ' (Fumble Turnover)';
                            const statFL = 'FUM TO:';
                            if(score.fum_lost != 0) {
                                let runningTotal = pushRunningTotal(score.fum_lost, statFL, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        }
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.statType == 'recoverer'
                            && player.playType != 9 
                            && play.teamStartPoss != play.teamEndPoss) {   
                                if(score.idp_fum_rec) {                                 // FUMBLE RECOVERY IDP
                                    const stat = 'FR:';
                                    const entryIDP = {
                                        order: play.order,
                                        side: 'defense',
                                        manager: player.manager,
                                        playerInfo: player.playerInfo,
                                        stat: ['idp_fum_rec'],
                                        runningTotals: [],
                                        fpts: score.idp_fum_rec,
                                        description: play.description,
                                        shortDesc: 'Fumble Recovery',
                                    }
                                    if(entryIDP.fpts != 0) {
                                        let runningTotal = pushRunningTotal(entryIDP.fpts, stat, entryIDP.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entryIDP.runningTotals.push(runningTotal);
                                    }
                                    fantasyPlay[play.playID].push(entryIDP);
                                }
                    } else if(player.statType == 'forcedBy' // TO-DO make sure ALL potential fpts-scoring plays are calculated - we'll filter out the ones the leaague doesn't count later
                            && player.playType != 53 // no kickoffs or punts (TO-DO: field goals)
                            && player.playType != 52) {  
                                if(player.playType == 9) {                        // FUMBLE FORCED PTS - IDP
                                    const fpts = (score?.idp_ff || 0);       
                                    const stat = 'FF:';
                                    const entryIDP = {
                                        order: play.order,
                                        side: 'defense',
                                        manager: player.manager,
                                        playerInfo: player.playerInfo,
                                        stat: ['idp_ff'],
                                        runningTotals: [],
                                        fpts,
                                        description: play.description,
                                        shortDesc: 'Forced Fumble',
                                    }
                                    if(fpts != 0) {
                                        let runningTotal = pushRunningTotal(fpts, stat, entryIDP.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entryIDP.runningTotals.push(runningTotal);
                                    }
                                    fantasyPlay[play.playID].push(entryIDP);
                                }  
                    }
                    if(player.playType == 5 && player.statType == 'rusher') {         // RUSH
                        const fpts = player.yards * (score?.rush_yd || 0) + (score?.rush_att || 0);
                        const fptsRun = (score?.rush_att || 0);
                        const fptsRunYDS = player.yards * (score?.rush_yd || 0);
                        const statRun = 'RUSH:';
                        const statRunYDS = 'RUSH YDS:';
                        const entry = {
                            order: play.order,
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['rush_yd', 'rush_att'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Rush',
                        }
                        if(fptsRun != 0) {
                            let runningTotal = pushRunningTotal(fptsRun, statRun, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        if(fptsRunYDS != 0) {
                            let runningTotal = pushRunningTotal(fptsRunYDS, statRunYDS, entry.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        if(player.yards >= 40 && score.rush_40p) {          // RUSH YD BONUS
                            entry.fpts += score.rush_40p;
                            entry.stat.push('rush_40p');
                            const stat = 'RUSH(40):';
                            if(fptsRun != 0) {
                                let runningTotal = pushRunningTotal(score.rush_40p, stat, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        }
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.playType == 68 && player.statType == 'rusher') {            // RUSH TD  NOTE TO-DO: ACCOUNT FOR LATERALS (SAME WITH REC TDs)
                        const fpts = player.yards * (score?.rush_yd || 0) + (score?.rush_att || 0) + (score?.rush_td || 0);
                        const fptsRun = (score?.rush_att || 0);
                        const fptsRunYDS = player.yards * (score?.rush_yd || 0);
                        const fptsRunTD = (score?.rush_td || 0);
                        const statRun = 'RUSH:';
                        const statRunYDS = 'RUSH YDS:';
                        const statRunTD = 'RUSH TD:';
                        const entry = {
                            order: play.order,
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['rush_yd', 'rush_att', 'rush_td'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Rushing Touchdown',
                        }
                        if(fptsRun != 0) {
                            let runningTotal = pushRunningTotal(fptsRun, statRun, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        if(fptsRunYDS != 0) {
                            let runningTotal = pushRunningTotal(fptsRunYDS, statRunYDS, entry.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        if(fptsRunTD != 0) {
                            let runningTotal = pushRunningTotal(fptsRunTD, statRunTD, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        if(40 <= player.yards && player.yards < 50 && score.rush_td_40p) {          // RUSH TD YD BONUS
                            entry.fpts += score.rush_td_40p;
                            entry.stat.push('rush_td_40p');
                            const stat = 'RUSH(TD40):';
                            if(score.rush_td_40p != 0) {
                                let runningTotal = pushRunningTotal(score.rush_td_40p, stat, entry.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        } else if(player.yards >= 50 && score.rush_td_50p) {
                            entry.fpts += score.rush_td_50p;
                            entry.stat.push('rush_td_50p');
                            const stat = 'RUSH(TD50):';
                            if(score.rush_td_50p != 0) {
                                let runningTotal = pushRunningTotal(score.rush_td_50p, stat, entry.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        }
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.playType == 26) {          // INTERCEPTION
                        if(player.statType == 'passer') {                       // INT QB PENALTY
                            const fpts = (score?.pass_int || 0) + (score?.pass_att || 0) + (score?.pass_inc || 0);;
                            const fptsINT = (score?.pass_int || 0);
                            const fptsPass = (score?.pass_att || 0);
                            const fptsInc = (score?.pass_inc || 0);
                            const statINT = 'INT:';
                            const statPass = 'PASS:';
                            const statInc = 'INCMP:';
                            const entry = {
                                order: play.order,
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_int', 'pass_att', 'pass_inc'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Interception Thrown',
                            }  
                            if(fptsINT != 0) {
                                let runningTotal = pushRunningTotal(fptsINT, statINT, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsPass != 0) {
                                let runningTotal = pushRunningTotal(fptsPass, statPass, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsInc != 0) {
                                let runningTotal = pushRunningTotal(fptsInc, statInc, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entry);
                        }       
                    } else if(player.playType == 36) {            // PICK SIX 
                        if(player.statType == 'scorer' && (score.idp_int || score.idp_def_td || score.idp_int_ret_yd)) {        // P6 IDP
                            const fpts = (score?.idp_int || 0) + (score?.idp_def_td || 0) + player.yards * (score?.idp_int_ret_yd || 0);
                            const fptsINT = (score?.idp_int || 0);
                            const fptsINTyds = player.yards * (score?.idp_int_ret_yd || 0);
                            const fptsTD = (score?.idp_def_td || 0);
                            const statINT = 'INT:';
                            const statINTyds = 'INT YDS:';
                            const statTD = 'INT TD:';
                            const entryIDP = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['idp_int', 'idp_def_td', 'idp_int_ret_yd'],
                                runningTotals: [],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Pick Six',
                            }
                            if(fptsINT != 0) {
                                let runningTotal = pushRunningTotal(fptsINT, statINT, entryIDP.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryIDP.runningTotals.push(runningTotal);
                            }
                            if(fptsINTyds != 0) {
                                let runningTotal = pushRunningTotal(fptsINTyds, statINTyds, entryIDP.stat[2], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryIDP.runningTotals.push(runningTotal);
                            }
                            if(fptsTD != 0) {
                                let runningTotal = pushRunningTotal(fptsTD, statTD, entryIDP.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryIDP.runningTotals.push(runningTotal);
                            }
                            if(player.yards >= 50 && score.bonus_def_int_td_50p) {                  // P6 IDP YD BONUS
                                entryIDP.fpts += score.bonus_def_int_td_50p;
                                entryIDP.stat.push('bonus_def_int_td_50p');
                                const stat = 'INT TD(50):';
                                if(score.bonus_def_int_td_50p != 0) {
                                    let runningTotal = pushRunningTotal(score.bonus_def_int_td_50p, stat, entryIDP.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entryIDP.runningTotals.push(runningTotal);
                                }
                            }
                            fantasyPlay[play.playID].push(entryIDP);
                        }   
                        if(player.statType == 'passer') {                       // P6 QB PENALTY
                            const fpts = (score?.pass_int || 0) + (score?.pass_inc || 0) + (score?.pass_int_td || 0) + (score?.pass_att || 0);
                            const fptsINT = (score?.pass_int || 0);
                            const fptsPass = (score?.pass_att || 0);
                            const fptsInc = (score?.pass_inc || 0);
                            const fptsTD = (score?.pass_int_td || 0);
                            const statINT = 'INT:';
                            const statPass = 'Pass:';
                            const statInc = 'INCMP:';
                            const statTD = 'PICK 6:';
                            const entry = {
                                order: play.order,
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_int', 'pass_inc', 'pass_int_td', 'pass_att'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Pick Six Thrown',
                            }  
                            if(fptsINT != 0) {
                                let runningTotal = pushRunningTotal(fptsINT, statINT, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsPass != 0) {
                                let runningTotal = pushRunningTotal(fptsPass, statPass, entry.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsInc != 0) {
                                let runningTotal = pushRunningTotal(fptsInc, statInc, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsTD != 0) {
                                let runningTotal = pushRunningTotal(fptsTD, statTD, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entry);
                        } 
                    } else if(player.playType == 24) {          // COMPLETE PASS
                        if(player.statType == 'passer') {
                            const fpts = player.yards * (score?.pass_yd || 0) + (score?.pass_att || 0) + (score?.pass_cmp || 0);
                            const fptsPass = (score?.pass_att || 0);
                            const fptsCmp = (score?.pass_cmp || 0);
                            const fptsYDS = player.yards * (score?.pass_yd || 0);
                            const statYDS = 'PASS YDS:';
                            const statPass = 'PASS:';
                            const statCmp = 'CMP:';
                            const entry = {
                                order: play.order,
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_yd', 'pass_att', 'pass_cmp'],
                                runningTotals: [],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Pass Complete',
                            }   
                            if(fptsYDS != 0) {
                                let runningTotal = pushRunningTotal(fptsYDS, statYDS, entry.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsPass != 0) {
                                let runningTotal = pushRunningTotal(fptsPass, statPass, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsCmp != 0) {
                                let runningTotal = pushRunningTotal(fptsCmp, statCmp, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }   
                            if(player.yards >= 40 && score.pass_cmp_40p) {          // PASS YD BONUS
                                entry.fpts += score.pass_cmp_40p;
                                entry.stat.push('pass_cmp_40p');
                                const stat = 'CMP(40):';
                                if(score.pass_cmp_40p != 0) {
                                    let runningTotal = pushRunningTotal(score.pass_cmp_40p, stat, entry.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            }
                            fantasyPlay[play.playID].push(entry);
                        } else if(player.statType == 'receiver') {              // RECEPTION
                            const fpts = player.yards * (score?.rec_yd || 0) + (score?.rec || 0);
                            const fptsRec = (score?.rec || 0);
                            const statRec = 'REC:';
                            const entry = {
                                order: play.order,
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['rec_yd', 'rec'],
                                runningTotals: [],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Reception',
                            }
                            if(fptsRec != 0) {
                                let runningTotal = pushRunningTotal(fptsRec, statRec, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(0 < player.yards && player.yards < 5 && score.rec_0_4) {     // RECEPTION YD BONUS
                                entry.fpts += score.rec_0_4;
                                entry.stat.push('rec_0_4');
                            } else if(4 < player.yards && player.yards < 10 && score.rec_5_9) {
                                entry.fpts += score.rec_5_9;
                                entry.stat.push('rec_5_9');
                            } else if(9 < player.yards && player.yards < 20 && score.rec_10_19) {
                                entry.fpts += score.rec_10_19;
                                entry.stat.push('rec_10_19');
                            } else if(19 < player.yards && player.yards < 30 && score.rec_20_29) {
                                entry.fpts += score.rec_20_29;
                                entry.stat.push('rec_20_29');
                            } else if(29 < player.yards && player.yards < 40 && score.rec_30_39) {
                                entry.fpts += score.rec_30_39;
                                entry.stat.push('rec_30_39');
                            } else if(player.yards >= 40 && score.rec_40p) {
                                entry.fpts += score.rec_40p;
                                entry.stat.push('rec_40p');
                            }
                            const statYDS = 'REC YDS:';
                            if(entry.fpts != 0) {
                                let runningTotal = pushRunningTotal(entry.fpts, statYDS, entry.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(player.playerInfo.pos == 'RB' && score.bonus_rec_rb) {   // RECEPTION POS BONUS
                                entry.fpts += score.bonus_rec_rb;
                                entry.stat.push('bonus_rec_rb');
                                if(score.bonus_rec_rb != 0) {
                                    let runningTotal = pushRunningTotal(score.bonus_rec_rb, statRec, entry.stat[2], 0, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(player.playerInfo.pos == 'TE' && score.bonus_rec_te) {   
                                entry.fpts += score.bonus_rec_te;
                                entry.stat.push('bonus_rec_te');
                                if(score.bonus_rec_te != 0) {
                                    let runningTotal = pushRunningTotal(score.bonus_rec_te, statRec, entry.stat[2], 0, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(player.playerInfo.pos == 'WR' && score.bonus_rec_wr) {   
                                entry.fpts += score.bonus_rec_wr;
                                entry.stat.push('bonus_rec_wr');
                                if(score.bonus_rec_wr != 0) {
                                    let runningTotal = pushRunningTotal(score.bonus_rec_wr, statRec, entry.stat[2], 0, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            }
                            fantasyPlay[play.playID].push(entry);
                        }         
                    } else if(player.playType == 67) {                         // PASSING TD
                        if(player.statType == 'passer') {
                            const fpts = player.yards * (score?.pass_yd || 0) + (score?.pass_td || 0) + (score?.pass_cmp || 0) + (score?.pass_att || 0);
                            const fptsYDS = player.yards * (score?.pass_yd || 0);
                            const fptsPass = (score?.pass_att || 0);
                            const fptsCmp = (score?.pass_cmp || 0);
                            const fptsTD = (score?.pass_td || 0);
                            const statYDS = 'PASS YDS:';
                            const statPass = 'PASS:';
                            const statCmp = 'CMP:';
                            const statTD = 'PASS TD:';
                            const entry = {
                                order: play.order,
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_yd', 'pass_td', 'pass_cmp', 'pass_att'],
                                runningTotals: [],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Passing Touchdown',
                            }
                            if(fptsYDS != 0) {
                                let runningTotal = pushRunningTotal(fptsYDS, statYDS, entry.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsPass != 0) {
                                let runningTotal = pushRunningTotal(fptsPass, statPass, entry.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsCmp != 0) {
                                let runningTotal = pushRunningTotal(fptsCmp, statCmp, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsTD != 0) {
                                let runningTotal = pushRunningTotal(fptsTD, statTD, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(40 <= player.yards && player.yards < 50 && score.pass_td_40p) {          // PASSING TD YD BONUS
                                entry.fpts += score.pass_td_40p;
                                entry.stat.push('pass_td_40p');
                                const stat = 'Pass TD(40):';
                                if(score.pass_td_40p != 0) {
                                    let runningTotal = pushRunningTotal(score.pass_td_40p, stat, entry.stat[4], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(player.yards >= 50 && score.pass_td_50p) {
                                entry.fpts += score.pass_td_50p;
                                entry.stat.push('pass_td_50p');
                                const stat = 'Pass TD(50):';
                                if(score.pass_td_50p != 0) {
                                    let runningTotal = pushRunningTotal(score.pass_td_50p, stat, entry.stat[4], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            }
                            fantasyPlay[play.playID].push(entry);
                        } else if(player.statType == 'receiver') {                // RECEIVING TD
                            const fpts = player.yards * (score?.rec_yd || 0) + (score?.rec_td || 0) + (score?.rec || 0);
                            const fptsYDS = player.yards * (score?.rec_yd || 0);
                            const fptsRec = (score?.rec || 0);
                            const fptsTD = (score?.rec_td || 0);
                            const statYDS = 'REC YDS:';
                            const statTD = 'REC TD:';
                            const statRec = 'REC:';
                            const entry = {
                                order: play.order,
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['rec_yd', 'rec_td', 'rec'],
                                runningTotals: [],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Receiving Touchdown',
                            }
                            if(fptsYDS != 0) {
                                let runningTotal = pushRunningTotal(fptsYDS, statYDS, entry.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsRec != 0) {
                                let runningTotal = pushRunningTotal(fptsRec, statRec, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsTD != 0) {
                                let runningTotal = pushRunningTotal(fptsTD, statTD, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(40 <= player.yards && player.yards < 50 && score.rec_td_40p) {          // RECEIVING TD YD BONUS
                                entry.fpts += score.rec_td_40p;
                                entry.stat.push('rec_td_40p');
                                const stat = 'REC TD(40):';
                                if(score.rec_td_40p != 0) {
                                    let runningTotal = pushRunningTotal(score.rec_td_40p, stat, entry.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(player.yards >= 50 && score.rec_td_50p) {
                                entry.fpts += score.rec_td_50p;
                                entry.stat.push('rec_td_50p');
                                const stat = 'REC TD(50):';
                                if(score.rec_td_50p != 0) {
                                    let runningTotal = pushRunningTotal(score.rec_td_50p, stat, entry.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            }
                            fantasyPlay[play.playID].push(entry);
                        }
                    } else if(player.playType == 3 && player.statType == 'passer') {         // INCOMPLETE PASS
                        const fpts = (score?.pass_inc || 0) + (score?.pass_att || 0);
                        const fptsPass = (score?.pass_att || 0);
                        const fptsInc = (score?.pass_inc || 0);
                        const statPass = 'PASS:';
                        const statInc = 'INCMP:';
                        const entry = {
                            order: play.order,
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['pass_inc', 'pass_att'],
                            runningTotals: [],
                            fpts,
                            description: play.description,
                            shortDesc: 'Pass Incomplete',
                        }
                        if(fptsPass != 0) {
                            let runningTotal = pushRunningTotal(fptsPass, statPass, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        if(fptsInc != 0) {
                            let runningTotal = pushRunningTotal(fptsInc, statInc, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.playType == 7) {         // SACK - QB
                        if(player.statType == 'passer' && score.pass_sack) {
                            const fpts = score.pass_sack;
                            const stat = 'SACK:';
                            const entry = {
                                order: play.order,
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_sack'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Sacked',
                            }
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, stat, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entry);
                        }
                    } else if(player.playType == 59 && player.statType == 'kicker') {         // MADE FIELD GOAL
                        const fpts = (score?.fgm || 0) + player.yards * (score?.fgm_yds || 0);
                        const fptsFG = (score?.fgm || 0);
                        const fptsFGyds = player.yards * (score?.fgm_yds || 0);
                        const statFG = 'FG:';
                        const statFGyds = 'FG YDS:';
                        const entry = {
                            order: play.order,
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['fgm', 'fgm_yds'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Field Goal Made',
                        }
                        if(fptsFG != 0) {
                            let runningTotal = pushRunningTotal(fptsFG, statFG, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        if(fptsFGyds != 0) {
                            let runningTotal = pushRunningTotal(fptsFGyds, statFGyds, entry.stat[1], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        if(0 < player.yards && player.yards < 20 && score.fgm_0_19) {           // FG YD BONUS
                            entry.fpts += score.fgm_0_19;
                            entry.stat.push(score.fgm_0_19);
                            const stat = 'FG(0-19):';
                            if(score.fgm_0_19 != 0) {
                                let runningTotal = pushRunningTotal(score.fgm_0_19, stat, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        } else if(19 < player.yards && player.yards < 30 && score.fgm_20_29) {
                            entry.fpts += score.fgm_20_29;
                            entry.stat.push(score.fgm_20_29);
                            const stat = 'FG(20-29):';
                            if(score.fgm_20_29 != 0) {
                                let runningTotal = pushRunningTotal(score.fgm_20_29, stat, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        } else if(29 < player.yards) {
                            if(score.fgm_yds_over_30) {
                                entry.fpts += score.fgm_yds_over_30;
                                entry.stat.push(score.fgm_yds_over_30);
                                const sleepStat = 'score.fgm_yds_over_30';
                                const stat = 'FG(30+):';
                                if(score.fgm_yds_over_30 != 0) {
                                    let runningTotal = pushRunningTotal(score.fgm_yards_over_30, stat, sleepStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            }
                            if(player.yards < 40 && score.fgm_30_39) {
                                entry.fpts += score.fgm_30_39;
                                entry.stat.push(score.fgm_30_39);
                                const sleepStat = 'score.fgm_30_39';
                                const stat = 'FG(30-39):';
                                if(score.fgm_30_39 != 0) {
                                    let runningTotal = pushRunningTotal(score.fgm_30_39, stat, sleepStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(39 < player.yards && player.yards < 50 && score.fgm_40_49) {
                                entry.fpts += score.fgm_40_49;
                                entry.stat.push(score.fgm_40_49);
                                const sleepStat = 'score.fgm_40_49';
                                const stat = 'FG(40-49):';
                                if(score.fgm_40_49 != 0) {
                                    let runningTotal = pushRunningTotal(score.fgm_40_49, stat, sleepStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(player.yards >= 50 && score.fgm_50p) {
                                entry.fpts += score.fgm_50p;
                                entry.stat.push(score.fgm_50p);
                                const sleepStat = 'score.fgm_50p';
                                const stat = 'FG(50+):';
                                if(score.fgm_50p != 0) {
                                    let runningTotal = pushRunningTotal(score.fgm_50p, stat, sleepStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } 
                        }        
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.playType == 60 && player.statType == 'kicker') {           // MISSED FIELD GOAL
                        const fpts = (score?.fgmiss || 0);
                        const statFG = 'FG MISS:';
                        const entry = {
                            order: play.order,
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['fgmiss'],
                            runningTotals: [],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Field Goal Missed',
                        }   
                        if(fpts != 0) {
                            let runningTotal = pushRunningTotal(fpts, statFG, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                            entry.runningTotals.push(runningTotal);
                        }
                        if(0 < player.yards && player.yards < 20 && score.fgmiss_0_19) {           // MISSED FG YD PENALTY
                            entry.fpts += score.fgmiss_0_19;
                            entry.stat.push(score.fgmiss_0_19);
                            const stat = 'FG MISS(0-19):';
                            if(score.fgmiss_0_19 != 0) {
                                let runningTotal = pushRunningTotal(score.fgmiss_0_19, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        } else if(19 < player.yards && player.yards < 30 && score.fgmiss_20_29) {
                            entry.fpts += score.fgmiss_20_29;
                            entry.stat.push(score.fgmiss_20_29);  
                            const stat = 'FG MISS(20-29):';
                            if(score.fgmiss_20_29 != 0) {
                                let runningTotal = pushRunningTotal(score.fgmiss_20_29, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        } else if(29 < player.yards && player.yards < 40 && score.fgmiss_30_39) {
                            entry.fpts += score.fgmiss_30_39;
                            entry.stat.push(score.fgmiss_30_39); 
                            const stat = 'FG MISS(30-39):';
                            if(score.fgmiss_30_39 != 0) {
                                let runningTotal = pushRunningTotal(score.fgmiss_30_39, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        } else if(39 < player.yards && player.yards < 50 && score.fgmiss_40_49) {
                            entry.fpts += score.fgmiss_40_49;
                            entry.stat.push(score.fgmiss_40_49);    
                            const stat = 'FG MISS(40-49):';
                            if(score.fgmiss_40_49 != 0) {
                                let runningTotal = pushRunningTotal(score.fgmiss_40_49, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        } else if(player.yards >= 50 && score.fgmiss_50p) {
                            entry.fpts += score.fgmiss_50p;
                            entry.stat.push(score.fgmiss_50p);  
                            const stat = 'FG MISS(50+):';
                            if(score.fgmiss_50p != 0) {
                                let runningTotal = pushRunningTotal(score.fgmiss_50p, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                        } 
                        fantasyPlay[play.playID].push(entry);                                                        // TO-DO (maybe) NOTE: ADD IF OTHER KINDS OF TOUCHDOWNS  ALSO NOT SURE IF THIS WORKS;       
                    } else if(((player.playType == 68 || player.playType == 67) || play.scoringType == 'touchdown') // MISSED PAT
                                && !play.description.includes('extra point is GOOD')
                                && !play.description.includes('Kick)')
                                && player.statType == 'patScorer') {
                                    const fpts = (score?.xpmiss || 0);
                                    const stat = 'PAT MISS:';
                                    const entry = {
                                        order: play.order,
                                        side: 'offense',
                                        manager: player.manager,
                                        playerInfo: player.playerInfo,
                                        stat: ['xpmiss'],
                                        runningTotals: [],
                                        fpts,
                                        description: play.description,
                                        shortDesc: 'PAT Missed',
                                    }   
                                    if(fpts != 0) {
                                        let runningTotal = pushRunningTotal(fpts, stat, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entry.runningTotals.push(runningTotal);
                                    }
                                    fantasyPlay[play.playID].push(entry);                                                                                    
                    } else if(((player.playType == 68 || player.playType == 67) || play.scoringType == 'touchdown') // MADE PAT
                                && (play.description.includes('extra point is GOOD') || play.description.includes('Kick)'))
                                && player.statType == 'patScorer') {
                                    const fpts = (score?.xpm || 0);
                                    const stat = 'PAT:';
                                    const entry = {
                                        order: play.order,
                                        side: 'offense',
                                        manager: player.manager,
                                        playerInfo: player.playerInfo,
                                        stat: ['xpm'],
                                        runningTotals: [],
                                        fpts,
                                        description: play.description,
                                        shortDesc: 'PAT Made',
                                    }   
                                    if(fpts != 0) {
                                        let runningTotal = pushRunningTotal(fpts, stat, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entry.runningTotals.push(runningTotal);
                                    }
                                    fantasyPlay[play.playID].push(entry);                                                                                    
                    } else if(player.playType == 12) {
                        if(player.statType == 'returner') {
                            const fpts = player.yards * (score?.kr_yd || 0);
                            const stat = 'KO YDS:';
                            const entry = {
                                order: play.order,
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['kr_yd'],
                                runningTotals: [],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Kick Return',
                            }
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, stat, entry.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entry);
                        }
                    }   
                }                      
            }
            fantasyProducts.push(fantasyPlay[play.playID]);
        }
        // loop thru def-thresh plays                                                               // TEAM DEF YDS ALLOWED
        for(const playKey in defYdsThreshBreakers) {
            const play = defYdsThreshBreakers[playKey];
            if(!fantasyPlay[play.playInfo.playID]) {
                fantasyPlay[play.playInfo.playID] = [];
            }
            if(play.defense == away) {
                let curDEFscore = calculateDefYardsAllowed(play.new);
                let oldDEFscore = calculateDefYardsAllowed(play.old);
                const defense = startersArray.filter(s => s.playerID == away)[0];
                const fpts = curDEFscore.DEFscore - oldDEFscore.DEFscore;
                const statYDS = 'YDS ALW:';
                const entryDEF = {
                    order: play.playInfo.order,
                    side: 'defense',
                    manager: defense.owner,
                    playerInfo: defense,
                    stat: [curDEFscore.DEFthreshold],
                    runningTotals: [],
                    fpts,
                    description: play.playInfo.description,
                    shortDesc: curDEFscore.DEFdescription,
                }   
                if(score.yds_allow) {
                    entryDEF.stat.push('yds_allow');
                } 
                if(fpts != 0) {
                    let runningTotal = pushRunningTotal(fpts, statYDS, curDEFscore.DEFthreshold, play.new, defense.playerID, defense.pos); 
                    entryDEF.runningTotals.push(runningTotal);
                    fantasyPlay[play.playInfo.playID].push(entryDEF);
                }                
            } else if(play.defense == home) {
                let curDEFscore = calculateDefYardsAllowed(play.new);
                let oldDEFscore = calculateDefYardsAllowed(play.old);
                const defense = startersArray.filter(s => s.playerID == home)[0];
                const fpts = curDEFscore.DEFscore - oldDEFscore.DEFscore;
                const statYDS = 'YDS ALW:';               
                const entryDEF = {
                    order: play.playInfo.order,
                    side: 'defense',
                    manager: defense.owner,
                    playerInfo: defense,
                    stat: [curDEFscore.DEFthreshold],
                    runningTotals: [],
                    fpts,
                    description: play.description,
                    shortDesc: curDEFscore.DEFdescription,
                }   
                if(score.yds_allow) {
                    entryDEF.stat.push('yds_allow');
                } 
                if(fpts != 0) {
                    let runningTotal = pushRunningTotal(fpts, statYDS, curDEFscore.DEFthreshold, play.new, defense.playerID, defense.pos); 
                    entryDEF.runningTotals.push(runningTotal);
                    fantasyPlay[play.playInfo.playID].push(entryDEF);
                }
            }
        }
        // if DEF started, push entry for their starting points (pts/yds separated for later tallying)
        if(startersArray.filter(s => s.playerID == home).length > 0 || startersArray.filter(s => s.playerID == away).length > 0) {
            if(startersArray.filter(s => s.playerID == home).length > 0) {
                const fptsPTS = (score?.pts_allow_0 || 0);
                const fptsYDS = (score?.yds_allow_0_100 || 0);
                const team = startersArray.filter(s => s.playerID == home)[0];
                const statPTS = 'PTS ALW:';
                const statYDS = 'YDS ALW:';
                const entryDEFpts = {
                    order: 1,
                    side: 'defense',
                    manager: team.owner,
                    playerInfo: team,
                    stat: ['pts_allow_0'],
                    runningTotals: [], 
                    fpts: fptsPTS,
                    description: 'GAME BEGINS - DEF has allowed 0 points',
                    shortDesc: 'Points Allowed (0)',
                }   
                if(fptsPTS != 0) {
                    let runningTotal = pushRunningTotal(fptsPTS, statPTS, entryDEFpts.stat[0], 0, team.playerID, team.pos); 
                    entryDEFpts.runningTotals.push(runningTotal);
                } 
                const entryDEFyds = {
                    order: 1,
                    side: 'defense',
                    manager: team.owner,
                    playerInfo: team,
                    stat: ['yds_allow_0_100'],
                    runningTotals: [],
                    fpts: fptsYDS,
                    description: 'GAME BEGINS - DEF has allowed 0 yards',
                    shortDesc: 'Yards Allowed (0)',
                }   
                if(fptsYDS != 0) {
                    let runningTotal = pushRunningTotal(fptsYDS, statYDS, entryDEFyds.stat[0], 0, team.playerID, team.pos); 
                    entryDEFyds.runningTotals.push(runningTotal);
                }
                fantasyPlay[9999999] = [];
                fantasyPlay[9999999].push(entryDEFpts);
                fantasyPlay[9999998] = [];
                fantasyPlay[9999998].push(entryDEFyds);
                fantasyProducts.push(fantasyPlay[9999999]);
                fantasyProducts.push(fantasyPlay[9999998]);
            }
            if(startersArray.filter(s => s.playerID == away).length > 0) {
                const fptsPTS = (score?.pts_allow_0 || 0);
                const fptsYDS = (score?.yds_allow_0_100 || 0);
                const team = startersArray.filter(s => s.playerID == away)[0];
                const statPTS = 'PTS ALW:';
                const statYDS = 'YDS ALW:';
                const entryDEF = {
                    order: 2,
                    side: 'defense',
                    manager: team.owner,
                    playerInfo: team,
                    stat: ['pts_allow_0'],
                    runningTotals: [],
                    fpts: fptsPTS,
                    description: 'GAME BEGINS - DEF has allowed 0 points',
                    shortDesc: 'Points Allowed (0)',
                }   
                if(fptsPTS != 0) {
                    let runningTotal = pushRunningTotal(fptsPTS, statPTS, entryDEF.stat[0], 0, team.playerID, team.pos); 
                    entryDEF.runningTotals.push(runningTotal);
                }
                const entryDEFyds = {
                    order: 2,
                    side: 'defense',
                    manager: team.owner,
                    playerInfo: team,
                    stat: ['yds_allow_0_100'],
                    runningTotals: [],
                    fpts: fptsYDS,
                    description: 'GAME BEGINS - DEF has allowed 0 yards',
                    shortDesc: 'Yards Allowed (0)',
                }   
                if(fptsYDS != 0) {
                    let runningTotal = pushRunningTotal(fptsYDS, statYDS, entryDEFyds.stat[0], 0, team.playerID, team.pos); 
                    entryDEFyds.runningTotals.push(runningTotal);
                }
                fantasyPlay[9999999] = [];
                fantasyPlay[9999999].push(entryDEF);
                fantasyPlay[9999998] = [];
                fantasyPlay[9999998].push(entryDEFyds);
                fantasyProducts.push(fantasyPlay[9999999]);
                fantasyProducts.push(fantasyPlay[9999998]);
            }
        }

        fantasyProducts = fantasyProducts.sort((a, b) => b[0]?.order - a[0]?.order);
        fantasyProducts.push(runningTotals);
        
        return fantasyProducts; 
    }
    $: fantasyProducts = loadPlayByPlay(gameSelection, startersArray);
    

</script>

<style>
    .bigBox {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        z-index: auto;
        margin: 0.5em 0;
        width: auto;
        height: 79em;
		background-color: var(--f3f3f3);
        overflow-y: auto;
        align-items: center;
    }

    .playContainer {
        width: 99%;
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #222;
        margin: 0.2em;
        border-radius: 1em;
    }

    .playMainRow {
        display: inline-flex;
        background-color: var(--f3f3f3);
        position: relative;
        padding: 0.5em;
        margin: 0.2em;
        border-radius: 0.8em;
        font-size: 1.1em;
        font-weight: 420;
        width: 97%;
        align-items: center;
        justify-content: center;
    }

    .pointsPositive {
        display: inline-flex;
        align-items: center;
        color: #0d6c0d;
        position: relative;
        padding: 0.5em 0 0.5em 0.5em;
        font-size: 1.1em;
        font-weight: 420;
    }

    .pointsNegative {
        display: inline-flex;
        align-items: center;
        color: #740404;
        position: relative;
        padding: 0.5em 0 0.5em 0.5em;
        font-size: 1.1em;
        font-weight: 420;
    }

    .managerContainer {
        width: 50%;
        justify-content: flex-end;
        display: inline-flex;
    }

    .manager {
        display: inline-flex;
        width: auto;
        color: #ededed;
        justify-content: flex-end;
        align-items: center;
    }

    .playerAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 3.8em;
        margin: 0 0.5em;
        justify-content: center;
        height: fit-content;
        background-color: var(--f3f3f3);
    }

    .defenseAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 2.6em;
        margin: 0 1.1em;
        justify-content: center;
        height: fit-content;
        background-color: var(--f3f3f3);
    }

    .playerName {
        display: inline-flex;
        align-items: center;
        width: 15em;
        color: #ededed;
        justify-content: left;
        align-content: center;
    }

    .shortDescription {
        display: inline-flex;
        position: relative;
        left: 2.5em;
        align-items: center;
        width: 16em;
        color: #ededed;
        justify-content: center;
        align-content: center;
        font-weight: 400;
        font-style: italic;
    }

    .description {
        display: flex;
        width: 66em;
        font-size: 0.85em;
        font-weight: 600;
        color: #b7b7b7;
        justify-content: center;
        align-content: center;
        padding: 0 1em;
    }

</style>

    <div class="bigBox">
        {#await fantasyProducts}
            Loading fantasy play by play...
        {:then fantasyProducts}
            {#if !fantasyProducts.length > 0}
                No plays yet...
            {:else}
                {#each fantasyProducts as fantasyProduct}
                    <div class="playContainer">
                        {#if  Object.keys(fantasyProduct)[0]?.filter != 'password' && fantasyProduct[0] && fantasyProduct[0]?.fpts != 0}
                            {#each fantasyProduct as play}
                                <div class="playMainRow">
                                    <div class="{play.fpts > 0 ? "pointsPositive" : "pointsNegative"}">
                                        {#if play.fpts > 0}
                                            +{round(play.fpts)}
                                        {:else}
                                            {round(play.fpts)}
                                        {/if}
                                    </div>
                                    {#if play.side == 'offense'}
                                        <img class="playerAvatar" src="{play.playerInfo ? play.playerInfo.avatar : "https://sleepercdn.com/images/v2/icons/player_default.webp"}" alt="{play.playerInfo ? play.playerInfo.ln : "Player"}">
                                    {:else}
                                        <img class="defenseAvatar" src="{play.playerInfo ? play.playerInfo.avatar : "https://sleepercdn.com/images/v2/icons/player_default.webp"}" alt="{play.playerInfo ? play.playerInfo.ln : "Player"}">
                                    {/if}
                                    {#if play.side == 'offense'}
                                        <div class="playerName">{play.playerInfo.fn} {play.playerInfo.ln}</div>
                                    {:else}
                                        <div class="playerName">{play.playerInfo.playerID} Defense</div>
                                    {/if}
                                    <div class="shortDescription">{play.shortDesc}</div>
                                    <div class="managerContainer">
                                        <div class="manager">{play.manager.name}</div>
                                    </div>
                                </div>
                            {/each}
                            <div class="description">
                                {fantasyProduct[0]?.description}
                            </div>
                        {/if}
                    </div>
                {/each}
            {/if}
        {/await} 
    </div>
