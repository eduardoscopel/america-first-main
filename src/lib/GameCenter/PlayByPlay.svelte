<script>
    import { getPlayByPlay, waitForAll, round } from '$lib/utils/helper'; 

    export let nflTeams, nflMatchups, leagueData, fantasyStarters, managerInfo, weekMatchups, playersInfo, gameSelection = nflMatchups[0][0].gameID, matchSelection, managerSelection, fantasyProducts, viewPlayerID, showGameBox, showMatchBox, leaderBoardInfo;

    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/situation?lang=en&region=us CURRENT DOWN
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/plays?lang=en&region=us PLAY BY PLAY
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/competitors/22/statistics?lang=en&region=us GAME STATS
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436?lang=en&region=us GAME
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks ALL WEEKS
    // 4035687
    let startersArray = [];

    const loadPlayByPlay = async (gameSelection, matchSelection, startersArray, showGameBox, showMatchBox) => {

        let fantasyProducts = [];
        const score = leagueData.scoring_settings;
        const positions = leagueData.roster_positions.filter(p => p != 'BN');

        // extracts enforced penalty yardage from play description 
        const getTruePenalty = (playTeam, oppTeam, description) => {
            let truePenaltyInfo = {
                penalties: [],
                totalYards: 0,
                against: null,
            };

            if(description.includes(`PENALTY on ${playTeam}`)) {
                truePenaltyInfo.against = playTeam;
            } else {
                truePenaltyInfo.against = oppTeam;
            }

            // && description.indexOf('Unnecessary Roughness') - description.indexOf(`PENALTY on ${espnAbbv}`) > 0 
            //     && description.indexOf('Unnecessary Roughness') - description.indexOf(`PENALTY on ${espnAbbv}`) < 50)

            if(description.includes('Roughing the Passer')) {
                let penaltyYards;
                if(description.includes('(15 Yards)')) {
                    penaltyYards = description.substring(description.indexOf('(15 Yards)') + 12, description.indexOf('(15 Yards)') + 14);
                    if(penaltyYards[penaltyYards.length - 1] == ' ') {
                        penaltyYards = penaltyYards.slice(0, 1);
                    }
                    penaltyYards = parseInt(penaltyYards);
                } else {
                    penaltyYards = 15;
                }
                truePenaltyInfo.penalties.push(penaltyYards);
            }
            if(description.includes('Unsportsmanlike Conduct')) {
                let penaltyYards;
                if(description.includes('(15 Yards)')) {
                    penaltyYards = description.substring(description.indexOf('(15 Yards)') + 12, description.indexOf('(15 Yards)') + 14);
                    if(penaltyYards[penaltyYards.length - 1] == ' ') {
                        penaltyYards = penaltyYards.slice(0, 1);
                    }
                    penaltyYards = parseInt(penaltyYards);
                } else {
                    penaltyYards = 15;
                }
                truePenaltyInfo.penalties.push(penaltyYards);
            }
            if(description.includes('Face Mask (15 Yards)')) {
                let penaltyYards;
                if(description.includes('(15 Yards)')) {
                    penaltyYards = description.substring(description.indexOf('(15 Yards)') + 12, description.indexOf('(15 Yards)') + 14);
                    if(penaltyYards[penaltyYards.length - 1] == ' ') {
                        penaltyYards = penaltyYards.slice(0, 1);
                    }
                    penaltyYards = parseInt(penaltyYards);
                } else {
                    penaltyYards = 15;
                }
                truePenaltyInfo.penalties.push(penaltyYards);
            }
            if(description.includes('Unnecessary Roughness')) {
                let penaltyYards;
                if(description.includes('(15 Yards)')) {
                    penaltyYards = description.substring(description.indexOf('(15 Yards)') + 12, description.indexOf('(15 Yards)') + 14);
                    if(penaltyYards[penaltyYards.length - 1] == ' ') {
                        penaltyYards = penaltyYards.slice(0, 1);
                    }
                    penaltyYards = parseInt(penaltyYards);
                } else {
                    penaltyYards = 15;
                }
                truePenaltyInfo.penalties.push(penaltyYards);
            }
            if(description.includes('Taunting')){
                let penaltyYards = 10;
                truePenaltyInfo.penalties.push(penaltyYards);
            }
            if(description.includes('Defensive Holding')){
                let penaltyYards = 5;
                truePenaltyInfo.penalties.push(penaltyYards);
            }

            for(let i = 0; i < truePenaltyInfo.penalties.length; i++) {
                truePenaltyInfo.totalYards += truePenaltyInfo.penalties[i];
            }

            return truePenaltyInfo;
        }
        // processes DEF yards allowed
        const defensiveYards = (homeTeam, awayTeam, homeStart, homeYards, awayStart, awayYards, playObj) => {
            let defensiveYardsInfo = {
                defYdsThreshBreakers: [],
                newAwayYards: awayYards,
                newHomeYards: homeYards,
            };

            if(playObj.team == homeTeam) { 

                if(awayStart == true) {
                    let oldYA = defensiveYardsInfo.newAwayYards;

                    if((playObj.playType == 5 || playObj.playType == 7 || playObj.playType == 24 || playObj.playType == 67 || playObj.playType == 68)) {
                        defensiveYardsInfo.newAwayYards += playObj.yards;  
                        if(playObj.penalty == true && playObj.penaltyInfo.against == awayTeam) {
                            defensiveYardsInfo.newAwayYards = defensiveYardsInfo.newAwayYards - playObj.penaltyInfo.totalYards;
                        } else if(playObj.penalty == true && playObj.penaltyInfo.against == homeTeam) {
                            defensiveYardsInfo.newAwayYards += playObj.penaltyInfo.totalYards;
                        }                     
                    } else if((playObj.playType == 52 && score.def_pr_yd) || ((playObj.playType == 12 || playObj.playType == 32) && score.def_kr_yd) || ((playObj.playType == 17 || playObj.playType == 37) && score.blk_kick_ret_yd)) {
                        defensiveYardsInfo.newAwayYards = defensiveYardsInfo.newAwayYards - playObj.yards;
                        if(playObj.penalty == true && playObj.penaltyInfo.against == homeTeam) {
                            defensiveYardsInfo.newAwayYards += playObj.penaltyInfo.totalYards;
                        }    
                    }
                    // check if threshold broken
                    if((oldYA < 100 && defensiveYardsInfo.newAwayYards >= 100) || (oldYA < 200 && defensiveYardsInfo.newAwayYards >= 200) || (oldYA < 300 && defensiveYardsInfo.newAwayYards >= 300) || (oldYA < 350 && defensiveYardsInfo.newAwayYards >= 350) ||
                    (oldYA < 400 && defensiveYardsInfo.newAwayYards >= 400) || (oldYA < 450 && defensiveYardsInfo.newAwayYards >= 450) || (oldYA < 500 && defensiveYardsInfo.newAwayYards >= 500) || (oldYA < 550 && defensiveYardsInfo.newAwayYards >= 550)) {
                        defensiveYardsInfo.defYdsThreshBreakers.push({
                            old: oldYA,
                            new: defensiveYardsInfo.newAwayYards,
                            playInfo: playObj,
                            defense: awayTeam,
                        });
                    }
                }
                // if league tracks special teams return yardage, credit to the returning team & debit from the kicking team
                if(homeStart == true && ((playObj.playType == 52 && score.def_pr_yd) || ((playObj.playType == 12 || playObj.playType == 32) && score.def_kr_yd) || ((playObj.playType == 17 || playObj.playType == 37) && score.blk_kick_ret_yd))) {
                    let oldYA = defensiveYardsInfo.newHomeYards;
                    defensiveYardsInfo.newHomeYards += playObj.yards;
                    if(playObj.penalty == true && playObj.penaltyInfo.against == homeTeam) {
                        defensiveYardsInfo.newHomeYards = defensiveYardsInfo.newHomeYards - playObj.penaltyInfo.totalYards;
                    }    

                    // check if threshold broken
                    if((oldYA < 100 && defensiveYardsInfo.newHomeYards >= 100) || (oldYA < 200 && defensiveYardsInfo.newHomeYards >= 200) || (oldYA < 300 && defensiveYardsInfo.newHomeYards >= 300) || (oldYA < 350 && defensiveYardsInfo.newHomeYards >= 350) ||
                        (oldYA < 400 && defensiveYardsInfo.newHomeYards >= 400) || (oldYA < 450 && defensiveYardsInfo.newHomeYards >= 450) || (oldYA < 500 && defensiveYardsInfo.newHomeYards >= 500) || (oldYA < 550 && defensiveYardsInfo.newHomeYards >= 550)) {
                        defensiveYardsInfo.defYdsThreshBreakers.push({
                            old: oldYA,
                            new: defensiveYardsInfo.newHomeYards,
                            playInfo: playObj,
                            defense: homeTeam,
                        });
                    }
                }
            } else if(playObj.team == awayTeam) { 
                if(homeStart == true) {
                    let oldYA = defensiveYardsInfo.newHomeYards;  

                    if((playObj.playType == 5 || playObj.playType == 7 || playObj.playType == 24 || playObj.playType == 67 || playObj.playType == 68)) {
                        defensiveYardsInfo.newHomeYards += playObj.yards;
                        if(playObj.penalty == true && playObj.penaltyInfo.against == homeTeam) {
                            defensiveYardsInfo.newHomeYards = defensiveYardsInfo.newHomeYards - playObj.penaltyInfo.totalYards;
                        } else if(playObj.penalty == true && playObj.penaltyInfo.against == awayTeam) {
                            defensiveYardsInfo.newHomeYards += playObj.penaltyInfo.totalYards;
                        }   
                    } else if((playObj.playType == 52 && score.def_pr_yd) || ((playObj.playType == 12 || playObj.playType == 32) && score.def_kr_yd) || ((playObj.playType == 17 || playObj.playType == 37) && score.blk_kick_ret_yd)) {
                        defensiveYardsInfo.newHomeYards = defensiveYardsInfo.newHomeYards - playObj.yards;
                        if(playObj.penalty == true && playObj.penaltyInfo.against == awayTeam) {
                            defensiveYardsInfo.newHomeYards += playObj.penaltyInfo.totalYards;
                        }    
                    }
                    // check if threshold broken
                    if((oldYA < 100 && defensiveYardsInfo.newHomeYards >= 100) || (oldYA < 200 && defensiveYardsInfo.newHomeYards >= 200) || (oldYA < 300 && defensiveYardsInfo.newHomeYards >= 300) || (oldYA < 350 && defensiveYardsInfo.newHomeYards >= 350) ||
                        (oldYA < 400 && defensiveYardsInfo.newHomeYards >= 400) || (oldYA < 450 && defensiveYardsInfo.newHomeYards >= 450) || (oldYA < 500 && defensiveYardsInfo.newHomeYards >= 500) || (oldYA < 550 && defensiveYardsInfo.newHomeYards >= 550)) {
                        defensiveYardsInfo.defYdsThreshBreakers.push({
                            old: oldYA,
                            new: defensiveYardsInfo.newHomeYards,
                            playInfo: playObj,
                            defense: homeTeam,
                        });
                    }
                    
                }
                if(awayStart == true && ((playObj.playType == 52 && score.def_pr_yd) || ((playObj.playType == 12 || playObj.playType == 32) && score.def_kr_yd) || ((playObj.playType == 17 || playObj.playType == 37) && score.blk_kick_ret_yd))) {
                    let oldYA = defensiveYardsInfo.newAwayYards;
                    defensiveYardsInfo.newAwayYards = defensiveYardsInfo.newAwayYards - playObj.yards;
                    if(playObj.penalty == true && playObj.penaltyInfo.against == awayTeam) {
                        defensiveYardsInfo.newAwayYards = defensiveYardsInfo.newAwayYards - playObj.penaltyInfo.totalYards;
                    }    
                    // check if threshold broken
                    if((oldYA < 100 && defensiveYardsInfo.newAwayYards >= 100) || (oldYA < 200 && defensiveYardsInfo.newAwayYards >= 200) || (oldYA < 300 && defensiveYardsInfo.newAwayYards >= 300) || (oldYA < 350 && defensiveYardsInfo.newAwayYards >= 350) ||
                        (oldYA < 400 && defensiveYardsInfo.newAwayYards >= 400) || (oldYA < 450 && defensiveYardsInfo.newAwayYards >= 450) || (oldYA < 500 && defensiveYardsInfo.newAwayYards >= 500) || (oldYA < 550 && defensiveYardsInfo.newAwayYards >= 550)) {
                        defensiveYardsInfo.defYdsThreshBreakers.push({
                            old: oldYA,
                            new: defensiveYardsInfo.newAwayYards,
                            playInfo: playObj,
                            defense: awayTeam,
                        });
                    }
                }
            }
            return defensiveYardsInfo;
        }
        // tracks individual players' stat totals
        let runningTotals = {};
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
        // calculates FPTS due to DEF points allowed
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
        // calculates FPTS due to DEF yards allowed
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
                DEFdescription = `Yards Allowed (${teamYards.toString()})`;
            } 
            return {DEFscore, DEFthreshold, DEFdescription};
        }
        // processes plays and calculates FPTS
        const processPlays = (playArray, defYardsArray, homeDefStarted, awayDefStarted, homeTeam, awayTeam, homeDefense, awayDefense, homeDefPtsAllowed, awayDefPtsAllowed, gameState) => {
            let processedPlays = [];
            let fantasyPlay = {};
            for(const playKey in playArray) {
                const play = playArray[playKey];
                // create play-array to group fpts by multiple players in one play
                if(!fantasyPlay[play.playID]) {
                    fantasyPlay[play.playID] = [];
                }
                // TO-DO: other non-defensive-score-hurting touchdowns                                      TEAM DEF POINTS ALLOWED
                if((play.scoreAgainstOppDEF == true || play.scoreAgainstDEF == true) && (homeDefStarted == true || awayDefStarted == true)) {
                    if(play.team == homeTeam && ((play.scoreAgainstDEF == true && awayDefStarted == true) || (play.scoreAgainstOppDEF == true && homeDefStarted == true))) {
                        let oldAwayDefPtsAllowed = awayDefPtsAllowed - play.scoreValue;
                        let curDEFscore = calculateDefPointsAllowed(awayDefPtsAllowed);
                        let oldDEFscore = calculateDefPointsAllowed(oldAwayDefPtsAllowed);
                        const defense = awayDefense;
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
                    } else if(play.team == awayTeam && ((play.scoreAgainstDEF == true && homeDefStarted == true) || (play.scoreAgainstOppDEF == true && awayDefStarted == true))) {
                        let oldHomeDefPtsAllowed = homeDefPtsAllowed - play.scoreValue;
                        let curDEFscore = calculateDefPointsAllowed(homeDefPtsAllowed);
                        let oldDEFscore = calculateDefPointsAllowed(oldHomeDefPtsAllowed);
                        const defense = homeDefense;
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
                        let fumblerTeam;
                        if(player.statType == 'fumbler') {
                            fumblerTeam = player.playerInfo.t;
                        } else if(player.statType == 'scorer' && player.playType == 39) {                       // FUMBLE 6 - TEAM DEF
                            const fpts = (score?.def_td || 0);           
                            const statDesc = 'TD(D):';
                            const entryDEF = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['def_td'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Fumble 6',
                            }   
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, statDesc, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryDEF.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entryDEF);
                        } else if(player.statType == 'recoverer'
                                && (player.playType != 17 || (player.playType == 17 && fumblerTeam != null && fumblerTeam != player.playerInfo.t))
                                && (player.playType != 37 || (player.playType == 37 && fumblerTeam != null && fumblerTeam != player.playerInfo.t))
                                && player.playType != 9
                                && (player.playerInfo.t != fumblerTeam || player.playType == 29 || player.playType == 39)) {                    
                                    if(player.playType == 52 || player.playType == 12 || player.playType == 60 || player.playType == 17 || player.playType == 37 || player.playType == 32) {       // FUMBLE RECOVERY PTS - SPECIAL TEAM
                                        const fpts = (score?.def_st_fum_rec || 0);           
                                        const statDesc = 'FR:';
                                        const entryDEF = {
                                            order: play.order,
                                            side: 'defense',
                                            manager: player.manager,
                                            playerInfo: player.playerInfo,
                                            stat: ['def_st_fum_rec'],
                                            runningTotals: [],
                                            fpts,
                                            description: play.description,
                                            shortDesc: 'ST Fumble Recovery',
                                        }   
                                        if(fpts != 0) {
                                            let runningTotal = pushRunningTotal(fpts, statDesc, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                            entryDEF.runningTotals.push(runningTotal);
                                        }
                                        fantasyPlay[play.playID].push(entryDEF);
                                    } else {                                                                    // FUMBLE RECOVERY PTS - TEAM DEF
                                        const fpts = (score?.fum_rec || 0) + player.yards * (score?.fum_ret_yd || 0);            // NOTE TO-DO: May need to rethink how TEAM DEF pts scored for this
                                        const fptsREC = (score?.fum_rec || 0);
                                        const fptsYDS = player.yards * (score?.fum_ret_yd || 0);
                                        const statDesc = 'FR:';
                                        const statYDS = 'FR YDS:';
                                        const entryDEF = {
                                            order: play.order,
                                            side: 'defense',
                                            manager: player.manager,
                                            playerInfo: player.playerInfo,
                                            stat: ['fum_rec', 'fum_ret_yd'],
                                            runningTotals: [],
                                            fpts,
                                            yards: player.yards,
                                            description: play.description,
                                            shortDesc: 'Fumble Recovery',
                                        }   
                                        if(fptsREC != 0) {
                                            let runningTotal = pushRunningTotal(fptsREC, statDesc, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                            entryDEF.runningTotals.push(runningTotal);
                                        }
                                        if(fptsYDS != 0) {
                                            let runningTotal = pushRunningTotal(fptsYDS, statYDS, entryDEF.stat[0], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                                            entryDEF.runningTotals.push(runningTotal);
                                        }
                                        fantasyPlay[play.playID].push(entryDEF);
                                    }
                        } else if(player.statType == 'forcedBy') {          // FORCED FUMBLE PTS - TEAM ST
                            if(player.playType == 52 || player.playType == 12 || player.playType == 60 || player.playType == 17 || player.playType == 37 || player.playType == 32) {
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
                        } else if(player.statType == 'sackedBy' && sackRecorded == false) {            // SACK - TEAM DEF
                            const fpts = (score?.sack || 0) + player.yards * (score?.sack_yd || 0) + (score?.qb_hit || 0) + (score?.tkl || 0);
                            const fptsSack = (score?.sack || 0);
                            const fptsSackYDS = player.yards * (score?.sack_yd || 0);           
                            const fptsQBHIT = (score?.qb_hit || 0);
                            const fptsTKL = (score?.tkl || 0);
                            const statSack = 'SACK:';
                            const statSackYDS = 'SACK YDS:';
                            const statQBHIT = 'QB HIT:';
                            const statTKL = 'TKL:'
                            const entryDEF = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['sack', 'sack_yd', 'qb_hit', 'tkl'],
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
                            if(fptsQBHIT != 0) {
                                let runningTotal = pushRunningTotal(fptsQBHIT, statQBHIT, entryDEF.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryDEF.runningTotals.push(runningTotal);
                            }
                            if(fptsTKL != 0) {
                                let runningTotal = pushRunningTotal(fptsTKL, statTKL, entryDEF.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryDEF.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entryDEF);
                            sackRecorded = true;       // so that split-sacks aren't counted twice
                        } else if(player.playType == 36 && player.statType == 'scorer') {        // P6 TEAM DEF
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
                        } else if(player.statType == 'returner') {                  // KICKOFF RETURN YDS TEAM DEF/ST
                            if(player.playType == 12) {
                                const fpts = player.yards * (score?.def_kr_yd || 0);
                                const stat = 'KR YDS:';
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
                            } else if(player.playType == 52) {                  // PUNT - TEAM DEF/ST
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
                            } else if(player.playType == 32) {                  // KICK 6 - TEAM DEF/ST
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
                            } else if(player.playType == 26) {                      // INT TEAM DEF
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
                        } else if(player.playType == 60 && play.description.includes('BLOCKED') && player.statType == 'blocker') {                  // BLOCKED FIELD GOAL - TEAM DEF/ST
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
                        } else if((player.playType == 37 || player.playType == 17) && (player.statType == 'blocker' || player.statType == 'scorer')) {      
                            const entryDEF = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['blk_kick', 'blk_kick_ret_yd'],
                                runningTotals: [],
                                fpts: 0,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Blocked Punt',
                            }
                            if(player.statType == 'blocker') {
                                entryDEF.fpts += (score?.blk_kick || 0) + player.yards * (score?.blk_kick_ret_yd || 0);                                     // BLOCKED KICK + RETURN - TEAM ST
                                const fptsBLK = (score?.blk_kick || 0);
                                const fptsYDS = player.yards * (score?.blk_kick_ret_yd || 0);
                                const statBLK = 'BLK:';
                                const statYDS = 'BLK RET YDS:'
                                if(fptsBLK != 0) {
                                    let runningTotal = pushRunningTotal(fptsBLK, statBLK, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entryDEF.runningTotals.push(runningTotal);
                                }
                                if(fptsYDS != 0) {
                                    let runningTotal = pushRunningTotal(fptsYDS, statYDS, entryDEF.stat[1], player.yards, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entryDEF.runningTotals.push(runningTotal);
                                }
                            } else if(play.scoringPlay == true && player.statType == 'scorer') {                                                        // BLOCKED PUNT + TD - TEAM ST
                                const fptsTD = (score?.def_st_td || 0);
                                entryDEF.fpts += (score?.def_st_td || 0);
                                const statTD = 'ST TD:';
                                entryDEF.stat.push('def_st_td');
                                entryDEF.shortDesc = 'Blocked Punt -> Touchdown';
                                if(fptsTD != 0) {
                                    let runningTotal = pushRunningTotal(fptsTD, statTD, entryDEF.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entryDEF.runningTotals.push(runningTotal);
                                }
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
                            if(!play.description.includes(`recovered by ${player.playerTeam}`) & !play.description.includes(`and recovers`)) {      // PENALTY for FUMBLE -> TURNOVER
                                entry.fpts += (score?.fum_lost || 0); 
                                const fptsFUMTO = (score?.fum_lost || 0);                                  
                                entry.stat.push('fum_lost');
                                entry.shortDesc += ' & Turnover';
                                const statFL = 'FUM TO:';
                                if(fptsFUMTO != 0) {
                                    let runningTotal = pushRunningTotal(fptsFUMTO, statFL, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            }
                            fantasyPlay[play.playID].push(entry);
                        } else if(player.statType == 'recoverer' && player.playType != 9) {   
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
                        } else if(player.statType == 'forcedBy') {  
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
                        if(play.description.includes('TWO-POINT CONVERSION') && play.description.includes('SUCCEEDS')) {            // 2-PT CONVERSIONS
                            if(player.statType == 'patPasser') {                                                                    // 2-PT PASS
                                const fpts = (score?.pass_2pt || 0) + (score?.pass_att || 0) + (score?.pass_cmp || 0);
                                const fpts2PT = (score?.pass_2pt || 0);
                                const fptsATT = (score?.pass_att || 0);
                                const fptsCMP = (score?.pass_cmp || 0);
                                const stat2PT = '2PT PASS:';
                                const statATT = 'PASS:';
                                const statCMP = 'CMP:';
                                const entry = {
                                    order: play.order,
                                    side: 'offense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['pass_2pt', 'pass_att', 'pass_comp'],
                                    runningTotals: [],
                                    fpts,
                                    description: play.description,
                                    shortDesc: '2-PT Conversion (Pass)',
                                }
                                if(fpts2PT != 0) {
                                    let runningTotal = pushRunningTotal(fpts2PT, stat2PT, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                if(fptsATT != 0) {
                                    let runningTotal = pushRunningTotal(fptsATT, statATT, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                if(fptsCMP != 0) {
                                    let runningTotal = pushRunningTotal(fptsCMP, statCMP, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entry);
                            } else if(player.statType == 'patScorer' && play.description.includes('complete. ATTEMPT SUCCEEDS')) {                             // 2-PT RECEPTION TO-DO differentiate 2pt rushing 
                                const fpts = (score?.rec_2pt || 0) + (score?.rec || 0);
                                const fpts2PT = (score?.rec_2pt || 0);
                                const fptsREC = (score?.rec || 0);
                                const stat2PT = '2PT REC:';
                                const statREC = 'REC:';
                                const entry = {
                                    order: play.order,
                                    side: 'offense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['rec_2pt', 'rec'],
                                    runningTotals: [],
                                    fpts,
                                    description: play.description,
                                    shortDesc: '2-PT Conversion (Reception)',
                                }
                                if(fpts2PT != 0) {
                                    let runningTotal = pushRunningTotal(fpts2PT, stat2PT, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                if(fptsREC != 0) {
                                    let runningTotal = pushRunningTotal(fptsREC, statREC, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entry);
                            }
                        }
                        if((player.playType == 5 || player.playType == 9) && player.statType == 'rusher') {         // RUSH
                            let adjustedYards = player.yards;
                            if(play.penalty == true) {
                                if(play.penaltyInfo.against == player.playerTeam) {
                                    adjustedYards += play.penaltyInfo.totalYards;
                                } else {
                                    adjustedYards = adjustedYards - play.penaltyInfo.totalYards;
                                }
                            }
                            const fpts = adjustedYards * (score?.rush_yd || 0) + (score?.rush_att || 0);
                            const fptsRun = (score?.rush_att || 0);
                            const fptsRunYDS = adjustedYards * (score?.rush_yd || 0);
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
                                yards: adjustedYards,
                                description: play.description,
                                shortDesc: 'Rush',
                            }
                            if(fptsRun != 0) {
                                let runningTotal = pushRunningTotal(fptsRun, statRun, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(fptsRunYDS != 0) {
                                let runningTotal = pushRunningTotal(fptsRunYDS, statRunYDS, entry.stat[0], adjustedYards, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            if(adjustedYards >= 40 && score.rush_40p) {          // RUSH YD BONUS
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
                                entry.fpts += score.rush_td_40p + (score?.rush_40p || 0);
                                entry.stat.push('rush_td_40p');
                                entry.stat.push('rush_40p')
                                const stat = 'RUSH(TD40):';
                                const stat40P = 'RUSH(40):'
                                if(score.rush_td_40p != 0) {
                                    let runningTotal = pushRunningTotal(score.rush_td_40p, stat, entry.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                if(score.rush_40p != 0) {
                                    let runningTotal = pushRunningTotal(score.rush_40p, stat40P, entry.stat[4], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(player.yards >= 50 && score.rush_td_50p) {
                                entry.fpts += score.rush_td_50p + (score?.rush_40p || 0);
                                entry.stat.push('rush_td_50p');
                                entry.stat.push('rush_40p');
                                const stat = 'RUSH(TD50):';
                                const stat40P = 'RUSH(40):';
                                if(score.rush_td_50p != 0) {
                                    let runningTotal = pushRunningTotal(score.rush_td_50p, stat, entry.stat[3], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                if(score.rush_40p != 0) {
                                    let runningTotal = pushRunningTotal(score.rush_40p, stat40P, entry.stat[4], 1, player.playerInfo.playerID, player.playerInfo.pos); 
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
                        } else if((player.statType == 'passer' || player.statType == 'receiver') 
                            && (player.playType == 24 || player.playType == 9 || player.playType == 29 || player.playType == 39)) {          // COMPLETE PASS
                                if(player.statType == 'passer') {
                                    let adjustedYards = player.yards;
                                    if(play.penalty == true) {
                                        if(play.penaltyInfo.against == player.playerTeam) {
                                            adjustedYards += play.penaltyInfo.totalYards;
                                        } else {
                                            adjustedYards = adjustedYards - play.penaltyInfo.totalYards;
                                        }
                                    }
                                    const fpts = adjustedYards * (score?.pass_yd || 0) + (score?.pass_att || 0) + (score?.pass_cmp || 0);
                                    const fptsPass = (score?.pass_att || 0);
                                    const fptsCmp = (score?.pass_cmp || 0);
                                    const fptsYDS = adjustedYards * (score?.pass_yd || 0);
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
                                        yards: adjustedYards,
                                        description: play.description,
                                        shortDesc: 'Pass Complete',
                                    }   
                                    if(fptsYDS != 0) {
                                        let runningTotal = pushRunningTotal(fptsYDS, statYDS, entry.stat[0], adjustedYards, player.playerInfo.playerID, player.playerInfo.pos); 
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
                                    if(adjustedYards >= 40 && score.pass_cmp_40p) {          // PASS YD BONUS
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
                                    let adjustedYards = player.yards;
                                    if(play.penalty == true) {
                                        if(play.penaltyInfo.against == player.playerTeam) {
                                            adjustedYards += play.penaltyInfo.totalYards;
                                        } else {
                                            adjustedYards = adjustedYards - play.penaltyInfo.totalYards;
                                        }
                                    }
                                    const fpts = adjustedYards * (score?.rec_yd || 0) + (score?.rec || 0);
                                    const fptsRec = (score?.rec || 0);
                                    const fptsYDS = adjustedYards * (score?.rec_yd || 0)
                                    const statRec = 'REC:';
                                    const statYDS = 'REC YDS:';
                                    const entry = {
                                        order: play.order,
                                        side: 'offense',
                                        manager: player.manager,
                                        playerInfo: player.playerInfo,
                                        stat: ['rec_yd', 'rec'],
                                        runningTotals: [],
                                        fpts,
                                        yards: adjustedYards,
                                        description: play.description,
                                        shortDesc: 'Reception',
                                    }
                                    if(fptsRec != 0) {
                                        let runningTotal = pushRunningTotal(fptsRec, statRec, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entry.runningTotals.push(runningTotal);
                                    }
                                    if(fptsYDS != 0) {
                                        let runningTotal = pushRunningTotal(fptsYDS, statYDS, entry.stat[0], adjustedYards, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entry.runningTotals.push(runningTotal);
                                    }
                                    if(0 < adjustedYards && adjustedYards < 5 && score.rec_0_4) {     // RECEPTION YD BONUS
                                        entry.fpts += score.rec_0_4;
                                        entry.stat.push('rec_0_4');
                                        const sleeperStat = 'rec_0_4';
                                        if(score.rec_0_4 != 0) {
                                            let runningTotal = pushRunningTotal(score.rec_0_4, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                            entry.runningTotals.push(runningTotal);
                                        }
                                    } else if(4 < adjustedYards && adjustedYards < 10 && score.rec_5_9) {
                                        entry.fpts += score.rec_5_9;
                                        entry.stat.push('rec_5_9');
                                        const sleeperStat = 'rec_5_9';
                                        if(score.rec_5_9 != 0) {
                                            let runningTotal = pushRunningTotal(score.rec_5_9, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                            entry.runningTotals.push(runningTotal);
                                        }
                                    } else if(9 < adjustedYards && adjustedYards < 20 && score.rec_10_19) {
                                        entry.fpts += score.rec_10_19;
                                        entry.stat.push('rec_10_19');
                                        const sleeperStat = 'rec_10_19';
                                        if(score.rec_10_19 != 0) {
                                            let runningTotal = pushRunningTotal(score.rec_10_19, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                            entry.runningTotals.push(runningTotal);
                                        }
                                    } else if(19 < adjustedYards && adjustedYards < 30 && score.rec_20_29) {
                                        entry.fpts += score.rec_20_29;
                                        entry.stat.push('rec_20_29');
                                        const sleeperStat = 'rec_20_29';
                                        if(score.rec_0_4 != 0) {
                                            let runningTotal = pushRunningTotal(score.rec_20_29, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                            entry.runningTotals.push(runningTotal);
                                        }
                                    } else if(29 < adjustedYards && adjustedYards < 40 && score.rec_30_39) {
                                        entry.fpts += score.rec_30_39;
                                        entry.stat.push('rec_30_39');
                                        const sleeperStat = 'rec_30_39';
                                        if(score.rec_0_4 != 0) {
                                            let runningTotal = pushRunningTotal(score.rec_30_39, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                            entry.runningTotals.push(runningTotal);
                                        }
                                    } else if(adjustedYards >= 40 && score.rec_40p) {
                                        entry.fpts += score.rec_40p;
                                        entry.stat.push('rec_40p');
                                        const sleeperStat = 'rec_40p';
                                        if(score.rec_0_4 != 0) {
                                            let runningTotal = pushRunningTotal(score.rec_40p, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                            entry.runningTotals.push(runningTotal);
                                        }
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
                        } else if(player.playType == 67 && (player.statType == 'passer' || player.statType == 'receiver')) {                         // PASSING TD
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
                                entry.stat.push('fgm_0_19');
                                const stat = 'FG(0-19):';
                                if(score.fgm_0_19 != 0) {
                                    let runningTotal = pushRunningTotal(score.fgm_0_19, stat, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(19 < player.yards && player.yards < 30 && score.fgm_20_29) {
                                entry.fpts += score.fgm_20_29;
                                entry.stat.push('fgm_20_29');
                                const stat = 'FG(20-29):';
                                if(score.fgm_20_29 != 0) {
                                    let runningTotal = pushRunningTotal(score.fgm_20_29, stat, entry.stat[2], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(29 < player.yards) {       
                                entry.fpts += ((score?.fgm_yds_over_30 || 0) * (player.yards - 30));
                                const newFpts = (score?.fgm_yds_over_30 || 0) * (player.yards - 30);
                                entry.stat.push('fgm_yds_over_30');
                                const sleepStat = 'fgm_yds_over_30';
                                const stat = 'FG(30+):';
                                if(score.fgm_yds_over_30 != 0) {
                                    let runningTotal = pushRunningTotal(newFpts, stat, sleepStat, player.yards - 30, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                if(player.yards < 40 && score.fgm_30_39) {
                                    entry.fpts += score.fgm_30_39;
                                    entry.stat.push('fgm_30_39');
                                    const sleepStat = 'fgm_30_39';
                                    const stat = 'FG(30-39):';
                                    if(score.fgm_30_39 != 0) {
                                        let runningTotal = pushRunningTotal(score.fgm_30_39, stat, sleepStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entry.runningTotals.push(runningTotal);
                                    }
                                } else if(39 < player.yards && player.yards < 50 && score.fgm_40_49) {
                                    entry.fpts += score.fgm_40_49;
                                    entry.stat.push('fgm_40_49');
                                    const sleepStat = 'fgm_40_49';
                                    const stat = 'FG(40-49):';
                                    if(score.fgm_40_49 != 0) {
                                        let runningTotal = pushRunningTotal(score.fgm_40_49, stat, sleepStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entry.runningTotals.push(runningTotal);
                                    }
                                } else if(player.yards >= 50 && score.fgm_50p) {
                                    entry.fpts += score.fgm_50p;
                                    entry.stat.push('fgm_50p');
                                    const sleepStat = 'fgm_50p';
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
                                entry.stat.push('fgmiss_0_19');
                                const stat = 'FG MISS(0-19):';
                                if(score.fgmiss_0_19 != 0) {
                                    let runningTotal = pushRunningTotal(score.fgmiss_0_19, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(19 < player.yards && player.yards < 30 && score.fgmiss_20_29) {
                                entry.fpts += score.fgmiss_20_29;
                                entry.stat.push('fgmiss_20_29');  
                                const stat = 'FG MISS(20-29):';
                                if(score.fgmiss_20_29 != 0) {
                                    let runningTotal = pushRunningTotal(score.fgmiss_20_29, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(29 < player.yards && player.yards < 40 && score.fgmiss_30_39) {
                                entry.fpts += score.fgmiss_30_39;
                                entry.stat.push('fgmiss_30_39'); 
                                const stat = 'FG MISS(30-39):';
                                if(score.fgmiss_30_39 != 0) {
                                    let runningTotal = pushRunningTotal(score.fgmiss_30_39, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(39 < player.yards && player.yards < 50 && score.fgmiss_40_49) {
                                entry.fpts += score.fgmiss_40_49;
                                entry.stat.push('fgmiss_40_49');    
                                const stat = 'FG MISS(40-49):';
                                if(score.fgmiss_40_49 != 0) {
                                    let runningTotal = pushRunningTotal(score.fgmiss_40_49, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } else if(player.yards >= 50 && score.fgmiss_50p) {
                                entry.fpts += score.fgmiss_50p;
                                entry.stat.push('fgmiss_50p');  
                                const stat = 'FG MISS(50+):';
                                if(score.fgmiss_50p != 0) {
                                    let runningTotal = pushRunningTotal(score.fgmiss_50p, stat, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                            } 
                            fantasyPlay[play.playID].push(entry);                                                        // TO-DO (maybe) NOTE: ADD IF OTHER KINDS OF TOUCHDOWNS  ALSO NOT SURE IF THIS WORKS;       
                        } else if(((player.playType == 68 || player.playType == 67) || play.scoringType == 'touchdown') // MISSED PAT
                                    && !play.description.includes('extra point is GOOD')
                                    && play.description.includes('extra point is No Good')
                                    && !play.description.includes('Kick)')
                                    && (player.statType == 'patScorer' || player.statType == 'kicker')) {
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
                        } else if((player.playType == 17 || player.playType == 37) && player.statType == 'blocker') {               // IDP - BLOCK KICK
                            const fpts = (score?.idp_blk_kick || 0);
                            const stat = 'BLK:';
                            const entry = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['idp_blk_kick'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Blocked Kick',
                            }
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, stat, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entry);
                        } else if(player.statType == 'scorer' && (player.playType == 17 || player.playType == 37 || player.playType == 29 || player.playType == 39)) {               // IDP - TD (other than pick 6)
                            if(player.playType == 17 || player.playType == 37) {                        // IDP - BLOCKED PUNT RETURN TD
                                const fpts = (score?.idp_def_td || 0);
                                const stat = 'TD:';
                                const entry = {
                                    order: play.order,
                                    side: 'defense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['idp_def_td'],
                                    runningTotals: [],
                                    fpts,
                                    description: play.description,
                                    shortDesc: 'Blocked Punt -> Touchdown',
                                }
                                if(fpts != 0) {
                                    let runningTotal = pushRunningTotal(fpts, stat, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entry);
                            } else if(player.playType == 29 || player.playType == 39) {                        // IDP - FUMBLE SIX
                                const fpts = (score?.idp_def_td || 0);
                                const stat = 'TD:';
                                const entry = {
                                    order: play.order,
                                    side: 'defense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['idp_def_td'],
                                    runningTotals: [],
                                    fpts,
                                    description: play.description,
                                    shortDesc: 'Fumble Six',
                                }
                                if(fpts != 0) {
                                    let runningTotal = pushRunningTotal(fpts, stat, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entry);
                            }
                        }
                    }                      
                }
            }
            // loop thru def-thresh plays                                                               // TEAM DEF YDS ALLOWED
            for(const playKey in defYardsArray) {
                const play = defYardsArray[playKey];
                if(!fantasyPlay[play.playInfo.playID]) {
                    fantasyPlay[play.playInfo.playID] = [];
                }
                if(play.defense == awayTeam) {
                    let curDEFscore = calculateDefYardsAllowed(play.new);
                    let oldDEFscore = calculateDefYardsAllowed(play.old);
                    const defense = awayDefense;
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
                } else if(play.defense == homeTeam) {
                    let curDEFscore = calculateDefYardsAllowed(play.new);
                    let oldDEFscore = calculateDefYardsAllowed(play.old);
                    const defense = homeDefense;
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
                }
            }
            // if game has started and a DEF is playing, push entry for their starting points 
            if((gameState == 'in' || gameState == 'post') && (homeDefStarted == true || awayDefStarted == true)) {
                if(homeDefStarted == true) {
                    const fptsPTS = (score?.pts_allow_0 || 0);
                    const fptsYDS = (score?.yds_allow_0_100 || 0);
                    const team = homeDefense;
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
                }
                if(awayDefStarted == true) {
                    const fptsPTS = (score?.pts_allow_0 || 0);
                    const fptsYDS = (score?.yds_allow_0_100 || 0);
                    const team = awayDefense;
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
                }
            }

            for(const key in fantasyPlay) {
                processedPlays.push(fantasyPlay[key]);
            }
            processedPlays = processedPlays.sort((a, b) => b[0]?.order - a[0]?.order);

            return processedPlays;
        }

        // league matchup play by play
        if(showMatchBox == true) {
            let match = weekMatchups[matchSelection];
            const relevancyKey = {
                recordManIDs: [],
                starters: {},
                games: [],
            }
            runningTotals = {};
            let fantasyProducts_match = [];

            for(const opponent in match) {
                // get managers in matchup
                relevancyKey.recordManIDs.push(match[opponent].recordManID);
                relevancyKey.starters[match[opponent].recordManID] = [];
                // get starters in matchup
                let starters =  match[opponent].starters;

                for(const starter of starters) {
                    if(starter != '0') {
                        const starterInfo = playersInfo.players[starter];
                        const starterEntry = {
                            playerID: starter,
                            rosterSpot: positions[starters.indexOf(starter)],
                            fpts: match[opponent].points[starters.indexOf(starter)],
                            owner: managerInfo[match[opponent].recordManID],
                            recordManID: match[opponent].recordManID,
                            fn: starterInfo.fn,
                            ln: starterInfo.ln,
                            pos: starterInfo.pos,
                            t: starterInfo.t,
                            avatar: starterInfo.pos == "DEF" ? `https://sleepercdn.com/images/team_logos/nfl/${starter.toLowerCase()}.png` : `https://sleepercdn.com/content/nfl/players/thumb/${starter}.jpg`,
                            teamAvatar: `https://sleepercdn.com/images/team_logos/nfl/${starterInfo.t.toLowerCase()}.png`,
                            teamColor: `background-color: #${nflTeams[starterInfo.t].color}6b`,
                            teamAltColor: `background-color: #${nflTeams[starterInfo.t].alternateColor}52`,
                        }
                        if(nflTeams[starterInfo.t].color == nflTeams[starterInfo.t].alternateColor && nflTeams[starterInfo.t].color == '000000') {
                            starterEntry.teamAltColor = `background-color: #ffffff52`;
                        }

                        relevancyKey.starters[match[opponent].recordManID].push(starterEntry);

                        // get starters' game IDs
                        let nflGameID = nflMatchups.filter(m => m.some(m => m.sleeperID == starterInfo.t))[0][0].gameID;
                        if(!relevancyKey.games.includes(nflGameID)) {
                            relevancyKey.games.push(nflGameID);
                        }
                    }
                }
            }
            // process every relevant game's play by play for plays relevant to matchup
            for(const gameSelect in relevancyKey.games) {
                let playByPlayData = await getPlayByPlay(relevancyKey.games[gameSelect], true).catch((err) => { console.error(err); });
                let recencyKey = playByPlayData.length;
                let fantasyRelevantPlaysForward = [];
                let defYdsThreshBreakers = [];

                // identify NFL teams in the current game
                let game = nflMatchups.filter(m => m[0].gameID == relevancyKey.games[gameSelect])[0];
                let gameState = game[0].status.type.state;

                let home = game[0].sleeperID;
                let homeEspn = game[0].team.espnAbbreviation;
                let homeDefense = null;

                let away = game[1].sleeperID;
                let awayEspn = game[1].team.espnAbbreviation;
                let awayDefense = null;
            
                let homeDefStarted = new Boolean (false);
                let awayDefStarted = new Boolean (false);
                let homeDefPtsAllowed = 0;
                let awayDefPtsAllowed = 0;
                let homeDefYdsAllowed = 0;
                let awayDefYdsAllowed = 0;
                const score = leagueData.scoring_settings;

                // check if either DEF is being started
                for(const recordManID in relevancyKey.starters) {
                    if(relevancyKey.starters[recordManID].filter(s => s.playerID == home).length > 0) {
                        homeDefStarted = true;
                        homeDefense = relevancyKey.starters[recordManID].filter(s => s.playerID == home)[0];
                    } 
                    if(relevancyKey.starters[recordManID].filter(s => s.playerID == away).length > 0) {
                        awayDefStarted = true;
                        awayDefense = relevancyKey.starters[recordManID].filter(s => s.playerID == away)[0];
                    }
                }

                // start with first page
                for(let j = 0; j < recencyKey; j++) {
                    let playsData = playByPlayData[j].items;
                    // start with first play on page
                    for(let k = 0; k < playsData.length; k++) {
                        let play = playsData[k];
                        // find which team made the play (checking team of first play participant is most reliably correct way)
                        let espnTeamID;
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
                        let oppTeam;
                        for(const key in nflTeams) {
                            if(nflTeams[key].espnID == espnTeamID) {
                                playTeam = nflTeams[key].espnAbbreviation;
                                break;
                            }
                        }
                        if(playTeam == homeEspn) {
                            oppTeam = awayEspn;
                        } else {
                            oppTeam = homeEspn;
                        }
                        // flagging penalty-negated plays
                        let noPlay = new Boolean (false);
                        if(play.type.id == 8 || play.alternativeText.includes('No Play.') || play.type.id == 2 || play.type.id == 21 || play.type.id == 66 || play.type.id == 70 || play.type.id == 75) {
                            noPlay = true;
                        } else {
                            noPlay = false;
                        }
                        // flagging scoring plays & tracking DEF points allowed
                        let scoringPlay = new Boolean (false);
                        let scoreAgainstDEF = new Boolean (false);
                        let scoreAgainstOppDEF = new Boolean (false);
                        let scoringType = null;
                        let scoreValue = 0;
                        if(play.scoreValue > 0) {
                            scoringPlay = true;
                            scoringType = play.scoringType.name;
                            if(play.scoreValue == 6 && (play.alternativeText.includes('extra point is GOOD') || play.alternativeText.includes('Kick)'))) {
                                scoreValue = 7;
                            } else if(play.scoreValue == 6 && play.alternativeText.includes('TWO-POINT CONVERSION') && play.alternativeText.includes('SUCCEEDS')) {
                                scoreValue = 8;
                            } else {
                                scoreValue = play.scoreValue;
                            }
                            if(play.type.id == 17 || play.type.id == 37 || play.type.id == 32) {        // TO-DO add field goal kick 6 & 2pt return score
                                scoreAgainstDEF = false;
                                scoreAgainstOppDEF = true;
                                if(playTeam == homeEspn) {
                                    homeDefPtsAllowed += scoreValue;
                                } else {
                                    awayDefPtsAllowed += scoreValue;
                                }
                            } else if(play.type.id == 36 || play.type.id == 39 || play.type.id == 29) {     // pick 6 / fumble 6
                                scoreAgainstDEF = false;
                                scoreAgainstOppDEF = false;
                            } else {
                                scoreAgainstDEF = true;
                                scoreAgainstOppDEF = false;
                                if(playTeam == homeEspn) {
                                    awayDefPtsAllowed += scoreValue;
                                } else {
                                    homeDefPtsAllowed += scoreValue;
                                }
                            }
                        }
                        // the play object with all necessary info
                        const playEntry = {
                            playID: play.id,
                            order: parseInt(play.sequenceNumber),
                            playType: play.type.id,
                            team: playTeam,
                            oppTeam,
                            description: play.alternativeText,
                            scoringPlay,
                            scoringType,
                            scoreValue,
                            yards: play.statYardage,
                            relevantPlayers: [],
                            relevantDEF: [],
                            scoreAgainstDEF,
                            scoreAgainstOppDEF,
                            teamStartPoss: play.start.team?.$ref || null,
                            teamEndPoss: play?.end.team?.$ref || null,
                            noPlay,
                            penalty: new Boolean (false),
                            penaltyInfo: null,
                        }
                        // get penalty info
                        if(noPlay == false && play.alternativeText.includes('PENALTY') && play.alternativeText.includes('enforced')) {
                            let truePenaltyInfo = getTruePenalty(playTeam, oppTeam, play.alternativeText);
                            playEntry.penalty = true;
                            playEntry.penaltyInfo = truePenaltyInfo;
                        }
                        // process DEF yards allowed
                        if(noPlay == false && (homeDefStarted == true || awayDefStarted == true)) {
                            let defensiveYardsInfo = defensiveYards(homeEspn, awayEspn, homeDefStarted, homeDefYdsAllowed, awayDefStarted, awayDefYdsAllowed, playEntry);
                            awayDefYdsAllowed = defensiveYardsInfo.newAwayYards;
                            homeDefYdsAllowed = defensiveYardsInfo.newHomeYards;
                            if(defensiveYardsInfo.defYdsThreshBreakers.length > 0) {
                                for(const breaker of defensiveYardsInfo.defYdsThreshBreakers) {
                                    defYdsThreshBreakers.push(breaker);
                                }
                            }
                        }

                        // some "plays" in API don't have participants (ex. coin-toss)
                        if(noPlay == false && play.participants) {
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
                                        playerTeam = nflTeams[key].espnAbbreviation;
                                        break;
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
                                if(espnMatch.pos == 'PK') {
                                    espnMatch.pos = 'K';
                                }
                                let sleeperMatch = null;
                                for(const recordManID in relevancyKey.starters) {
                                    if(relevancyKey.starters[recordManID].filter(s => s.fn == espnMatch.fn && s.ln == espnMatch.ln && s.pos == espnMatch.pos).length > 0) {
                                        sleeperMatch = relevancyKey.starters[recordManID].filter(s => s.fn == espnMatch.fn && s.ln == espnMatch.ln && s.pos == espnMatch.pos);
                                        break;
                                    }
                                }
                                // if the current player involved in the play is a starter, we combine the sleeper and espn info for their entry in the playEntry
                                if(sleeperMatch != null) {
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
                                if((homeDefStarted == true || awayDefStarted == true)                                       // someone started a DEF
                                    && (play.type.id == 7 || play.type.id == 9 || play.type.id == 26 ||     // play was of a defensive type
                                        play.type.id == 36 || play.type.id == 52 || play.type.id == 12 ||   // TO-DO need to be able to catch yardage threshold breaks
                                        play.type.id == 32 || play.type.id == 17 || play.type.id == 29 || 
                                        play.type.id == 37 || play.type.id == 39 || (play.type.id == 60 && play.alternativeText.includes('BLOCKED')))
                                    && noPlay == false) {                                                       // no play-negating penalty
                                    if(awayDefStarted == true && playTeam == home) {
                                        const defense = awayDefense
                                        const relevantEntry = {
                                            playerInfo: defense,
                                            manager: defense.owner,
                                            statType: play.participants[playerKey].type,
                                            yards: play.statYardage, 
                                            playType: play.type.id,
                                            oppDef: away,
                                        }
                                        playEntry.relevantDEF.push(relevantEntry);
                                    } else if(homeDefStarted == true && playTeam == away) {
                                        const defense = homeDefense;
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
                let fantasyRelevantPlays = fantasyRelevantPlaysForward.slice().reverse();
                let fantasyProducts_matchGame = processPlays(fantasyRelevantPlays, defYdsThreshBreakers, homeDefStarted, awayDefStarted, homeEspn, awayEspn, homeDefense, awayDefense, homeDefPtsAllowed, awayDefPtsAllowed, gameState);

                for(const product of fantasyProducts_matchGame) {
                    fantasyProducts_match.push(product);
                }
            }
            fantasyProducts = fantasyProducts_match;
            fantasyProducts = fantasyProducts.filter(p => p.length > 0);
            fantasyProducts = fantasyProducts.sort((a, b) => b[0]?.order - a[0]?.order);
            // nfl game play by play
        } else if(showGameBox == true) {

            runningTotals = {};

            let playByPlayData = await getPlayByPlay(gameSelection, true).catch((err) => { console.error(err); });
            // set key to number of API pages for the full PBP
            let recencyKey = playByPlayData.length;
            let fantasyRelevantPlaysForward = [];
            let defYdsThreshBreakers = [];
            // startersArray will help us match our sleeper playerInfo to espn player APIs, and also check if someone is starting one of the DEFs
            startersArray = [];

            for(const recordManID in fantasyStarters) {
                const starters = fantasyStarters[recordManID].starters;

                for(const starter of starters) {
                    if(starter != '0') {
                        const starterInfo = playersInfo.players[starter];
                        const starterEntry = {
                            playerID: starter,
                            rosterSpot: positions[starters.indexOf(starter)],
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
            let gameState = game[0].status.type.state;

            let home = game[0].sleeperID;
            let homeEspn = game[0].team.espnAbbreviation;
            let homeDefense = null;

            let away = game[1].sleeperID;
            let awayEspn = game[1].team.espnAbbreviation;
            let awayDefense = null;

            let homeDefStarted = new Boolean (false);
            let awayDefStarted = new Boolean (false);
            let homeDefPtsAllowed = 0;
            let awayDefPtsAllowed = 0;
            let homeDefYdsAllowed = 0;
            let awayDefYdsAllowed = 0;

            // check if either DEF is being started
            if(startersArray.filter(s => s.playerID == home).length > 0) {
                homeDefStarted = true;
                homeDefense = startersArray.filter(s => s.playerID == home)[0];
            }
            if(startersArray.filter(s => s.playerID == away).length > 0) {
                awayDefStarted = true;
                awayDefense = startersArray.filter(s => s.playerID == away)[0];
            }

            // start with first page
            for(let j = 0; j < recencyKey; j++) {
                let playsData = playByPlayData[j].items;
                // start with first play on page
                for(let k = 0; k < playsData.length; k++) {
                    let play = playsData[k];
                    // which team made the play
                    let espnTeamID
                    if(play.participants && play.participants[0].statistics) {
                        if(play.participants[0].statistics.$ref.slice(115, 117)[1] != '/') {            // checking team of first play participant is most reliably correct way
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
                    let oppTeam;
                    for(const key in nflTeams) {
                        if(nflTeams[key].espnID == espnTeamID) {
                            playTeam = nflTeams[key].espnAbbreviation;
                            break;
                        }
                    }
                    if(playTeam == homeEspn) {
                        oppTeam = awayEspn;
                    } else {
                        oppTeam = homeEspn;
                    }
                    // flagging penalty-negated plays
                    let noPlay = new Boolean (false);
                    if(play.type.id == 8 || play.alternativeText.includes('No Play.') || play.type.id == 2 || play.type.id == 21 || play.type.id == 66 || play.type.id == 70 || play.type.id == 75) {
                        noPlay = true;
                    } else {
                        noPlay = false;
                    }
                    // flagging scoring plays & tracking DEF points allowed
                    let scoringPlay = new Boolean (false);
                    let scoreAgainstDEF = new Boolean (false);
                    let scoreAgainstOppDEF = new Boolean (false);
                    let scoringType = null;
                    let scoreValue = 0;
                    if(play.scoreValue > 0) {
                        scoringPlay = true;
                        scoringType = play.scoringType.name;
                        if(play.scoreValue == 6 && (play.alternativeText.includes('extra point is GOOD') || play.alternativeText.includes('Kick)'))) {
                            scoreValue = 7;
                        } else if(play.scoreValue == 6 && play.alternativeText.includes('TWO-POINT CONVERSION') && play.alternativeText.includes('SUCCEEDS')) {
                            scoreValue = 8;
                        } else {
                            scoreValue = play.scoreValue;
                        }
                        if(play.type.id == 17 || play.type.id == 37 || play.type.id == 32) {        // TO-DO add field goal kick 6 & 2pt return score
                            scoreAgainstDEF = false;
                            scoreAgainstOppDEF = true;
                            if(playTeam == homeEspn) {
                                homeDefPtsAllowed += scoreValue;
                            } else {
                                awayDefPtsAllowed += scoreValue;
                            }
                        } else if(play.type.id == 36 || play.type.id == 39 || play.type.id == 29) {    // pick 6 / fumble 6
                            scoreAgainstDEF = false;
                            scoreAgainstOppDEF = false;
                        } else {
                            scoreAgainstDEF = true;
                            scoreAgainstOppDEF = false;
                            if(playTeam == homeEspn) {
                                awayDefPtsAllowed += scoreValue;
                            } else {
                                homeDefPtsAllowed += scoreValue;
                            }
                        }
                    }
                    // the play object with all necessary info
                    const playEntry = {
                        playID: play.id,
                        order: parseInt(play.sequenceNumber),
                        playType: play.type.id,
                        team: playTeam,
                        oppTeam,
                        description: play.alternativeText,
                        scoringPlay,
                        scoringType,
                        scoreValue,
                        yards: play.statYardage,
                        relevantPlayers: [],
                        relevantDEF: [],
                        scoreAgainstDEF,
                        scoreAgainstOppDEF,
                        teamStartPoss: play.start.team?.$ref || null,
                        teamEndPoss: play?.end.team?.$ref || null,
                        noPlay,
                        penalty: new Boolean (false),
                        penaltyInfo: null,
                    }
                    // get penalty info
                    if(noPlay == false && play.alternativeText.includes('PENALTY') && play.alternativeText.includes('enforced')) {
                        let truePenaltyInfo = getTruePenalty(playTeam, oppTeam, play.alternativeText);
                        playEntry.penalty = true;
                        playEntry.penaltyInfo = truePenaltyInfo;
                    }
                    // process DEF yards allowed
                    if(noPlay == false && (homeDefStarted == true || awayDefStarted == true)) {
                        let defensiveYardsInfo = defensiveYards(homeEspn, awayEspn, homeDefStarted, homeDefYdsAllowed, awayDefStarted, awayDefYdsAllowed, playEntry);
                        awayDefYdsAllowed = defensiveYardsInfo.newAwayYards;
                        homeDefYdsAllowed = defensiveYardsInfo.newHomeYards;
                        if(defensiveYardsInfo.defYdsThreshBreakers.length > 0) {
                            for(const breaker of defensiveYardsInfo.defYdsThreshBreakers) {
                                defYdsThreshBreakers.push(breaker);
                            }
                        }
                    }
         
                    if(noPlay == false && play.participants) {
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
                                    playerTeam = nflTeams[key].espnAbbreviation;
                                    break;
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
                            if(espnMatch.pos == 'PK') {
                                espnMatch.pos = 'K';
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
                            if((homeDefStarted == true || awayDefStarted == true)                                       // someone started a DEF
                                && (play.type.id == 7 || play.type.id == 9 || play.type.id == 26 ||     // play was of a defensive type
                                    play.type.id == 36 || play.type.id == 52 || play.type.id == 12 ||   // TO-DO need to be able to catch yardage threshold breaks
                                    play.type.id == 32 || play.type.id == 17 || play.type.id == 29 ||
                                    play.type.id == 37 || play.type.id == 39 || (play.type.id == 60 && play.alternativeText.includes('BLOCKED')))
                                && noPlay == false) {                                                       // no penalty
                                if(awayDefStarted == true && playTeam == home) {
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
                                } else if(homeDefStarted == true && playTeam == away) {
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
            // const espnScoringIDs = {        // currently only used for reference while coding - 
            //     2: 'end period',               these specific IDs make it easier to isolate 
            //     3: 'incomplete pass',          which stats are earning fpts
            //     5: 'rush',
            //     7: 'sack',
            //     8: 'penalty',
            //     9: 'fumble offense recovery',
            //     12: 'kickoff (return)',
            //     17: 'blocked punt',
            //     21: 'timeout',
            //     24: 'completed pass',
            //     26: 'interception',
            //     29: 'fumble turnover'
            //     32: 'kick six'
            //     36: 'pick six',
            //     37: 'blocked punt td',
            //     39: 'fumble six',
            //     52: 'punt',
            //     53: 'kickoff (no return)',
            //     59: 'FG good',
            //     60: 'FG miss'
            //     66: 'end game',
            //     67: 'pass TD', 
            //     68: 'rush TD',
            //     70: 'coin toss',
            //     75: '2-min warning',
            // }

            let fantasyRelevantPlays = fantasyRelevantPlaysForward.slice().reverse();
            let fantasyProducts_game = processPlays(fantasyRelevantPlays, defYdsThreshBreakers, homeDefStarted, awayDefStarted, homeEspn, awayEspn, homeDefense, awayDefense, homeDefPtsAllowed, awayDefPtsAllowed, gameState);
            fantasyProducts = fantasyProducts_game;
            fantasyProducts = fantasyProducts.filter(p => p.length > 0);
            fantasyProducts = fantasyProducts.sort((a, b) => b[0]?.order - a[0]?.order);
        }
        return {fantasyProducts, runningTotals}; 
    }

    const displayByPlay = async (gameSelection, matchSelection, startersArray, showGameBox, showMatchBox) => {
        fantasyProducts = await loadPlayByPlay(gameSelection, matchSelection, startersArray, showGameBox, showMatchBox);
        return fantasyProducts;
    }
    $: fantasyProducts = displayByPlay(gameSelection, matchSelection, startersArray, showGameBox, showMatchBox);  
    
    const filterPlays = (fantasyProducts, leaderBoardInfo, viewPlayerID, managerSelection) => {
        let filteredProducts = fantasyProducts.fantasyProducts;
        if(leaderBoardInfo && fantasyProducts.fantasyProducts && fantasyProducts.fantasyProducts.length > 1) {

            if(leaderBoardInfo.type == 'position') {
                filteredProducts = filteredProducts.filter(p => p.some(p => leaderBoardInfo.spec.includes(p.playerInfo.rosterSpot)));
            } else if(leaderBoardInfo.type == 'matchup' && managerSelection != 0) {
                filteredProducts = filteredProducts.filter(p => p.some(p => p.playerInfo.owner.recordManID == managerSelection));
            } 

            if(viewPlayerID != null) {
                filteredProducts = filteredProducts.filter(p => p.some(p => p.playerInfo.playerID == viewPlayerID));
            }
        }
        return filteredProducts;
    }
    $: filteredProducts = filterPlays(fantasyProducts, leaderBoardInfo, viewPlayerID, managerSelection);

</script>

<style>
    .bigBox {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        z-index: auto;
        margin: 0.5em 0;
        width: 100%;
        height: 79em;
		background-color: var(--f3f3f3);
        overflow-y: auto;
        align-items: center;
    }

    .playContainer {
        width: 100%;
        position: relative;
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #222;
        margin: 0.3% 0;
        border-radius: 1em;
    }

    .playMainRow {
        display: inline-flex;
        background-color: var(--f3f3f3);
        position: relative;
        padding: 0.5em;
        margin: 0.3% 1.5%;
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
        width: 45%;
        justify-content: flex-end;
        display: inline-flex;
        position: relative;
    }

    .manager {
        display: inline-flex;
        position: relative;
        width: 100%;
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
        position: relative;
        align-items: center;
        width: 38%;
        color: #ededed;
        justify-content: left;
        align-content: center;
    }

    .shortDescription {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 35%;
        color: #ededed;
        justify-content: center;
        align-content: center;
        font-size: 0.9em;
        font-weight: 400;
        font-style: italic;
    }

    .description {
        display: inline-flex;
        position: relative;
        width: 96%;
        font-size: 0.85em;
        font-weight: 600;
        color: #b7b7b7;
        justify-content: center;
        align-content: center;
    }

</style>

    <div class="bigBox">
        {#await fantasyProducts}
            Loading fantasy play by play...
        {:then fantasyProducts}
            {#if !fantasyProducts.fantasyProducts.length > 0}
                No plays yet...
            {:else}
                {#each filteredProducts as filteredProduct}
                    <div class="playContainer">
                        {#if filteredProduct[0] && filteredProduct[0]?.fpts != 0}
                            {#each filteredProduct as play}
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
                                {filteredProduct[0]?.description}
                            </div>
                        {/if}
                    </div>
                {/each}
            {/if}
        {/await} 
    </div>
