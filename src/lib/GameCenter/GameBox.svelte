<script>
    import { getPlayByPlay, waitForAll, round } from '$lib/utils/helper'; 

    export let nflTeams, nflMatchups, leagueData, fantasyStarters, managerInfo, playersInfo, gameSelection;

    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/situation?lang=en&region=us CURRENT DOWN
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/plays?lang=en&region=us PLAY BY PLAY
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/competitors/22/statistics?lang=en&region=us GAME STATS
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436?lang=en&region=us GAME
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks ALL WEEKS
    let startersArray = [];

    const loadPlayByPlay = async (gameSelection, startersArray) => {
        let playByPlayData = await getPlayByPlay(gameSelection, true).catch((err) => { console.error(err); });
        // set key to number of API pages for the full PBP
        let recencyKey = playByPlayData.length;
        let fantasyRelevantPlays = [];
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

        // work backwards from most recent PBP page
        for(let i = recencyKey; i > 0; i--) {
            let playsData = playByPlayData[i - 1].items;
            // work backwards from most recent play
            for(let p = playsData.length; p > 0; p--) {
                let play = playsData[p - 1];
                // which team made the play
                let espnTeamID
                if(play.team.$ref.slice(82, 84)[1] != '?') {
                    espnTeamID = play.team.$ref.slice(82, 84);
                } else {
                    espnTeamID = play.team.$ref.slice(82, 83);
                }
                let playTeam;
                for(const key in nflTeams) {
                    if(nflTeams[key].espnID == espnTeamID) {
                        playTeam = key;
                    }
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
                // tracking DEF yards allowed TO-DO: adjust for penalties
                if(playTeam == home && startersArray.filter(s => s.playerID == away).length > 0 
                   && (play.type.id == 5 || play.type.id == 7 || play.type.id == 24 || play.type.id == 67 || play.type.id == 68)) {
                    awayDefYdsAllowed += play.statYardage;
                } else if(playTeam == away && startersArray.filter(s => s.playerID == home).length > 0
                          && (play.type.id == 5 || play.type.id == 7 || play.type.id == 24 || play.type.id == 67 || play.type.id == 68)) {
                            homeDefYdsAllowed += play.statYardage;
                }
                // the play object with all necessary info
                const playEntry = {
                    playID: play.id,
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
                        if((startersArray.filter(s => s.playerID == home).length > 0 ||  // plays relevant to DEF if someone started a DEF
                          startersArray.filter(s => s.playerID == away).length > 0)
                          && (play.type.id == 7 || play.type.id == 9 || play.type.id == 26 ||
                              play.type.id == 36 || play.type.id == 52 || play.type.id == 53 ||
                              play.type.id == 32 || play.teamStartPoss != play.teamEndPoss ||
                              (play.type.id == 60 && play.alternativeText.includes('BLOCKED')))
                          && play.participants[playerKey].type != 'passer'
                          && play.participants[playerKey].type != 'receiver'
                          && play.participants[playerKey].type != 'rusher'
                          && play.participants[playerKey].type != 'punter') {
                            if(startersArray.filter(s => s.playerID == home).length > 0
                               && (playerTeam == home || ((play.type.id == 60 && play.alternativeText.includes('BLOCKED')) && playerTeam == away))) {
                                const defense = startersArray.filter(s => s.playerID == home)[0];
                                const relevantEntry = {
                                    playerInfo: defense,
                                    manager: defense.owner,
                                    statType: play.participants[playerKey].type,
                                    yards: play.statYardage, 
                                    playType: play.type.id,
                                    oppDef: away,
                                }
                                playEntry.relevantDEF.push(relevantEntry);
                            } else if(startersArray.filter(s => s.playerID == away).length > 0 
                                      && (playerTeam == away || ((play.type.id == 60 && play.alternativeText.includes('BLOCKED')) && playerTeam == home))) {
                                        const defense = startersArray.filter(s => s.playerID == away)[0];
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
                }
                // only push on plays involving starters
                if(playEntry.relevantPlayers.length > 0 || playEntry.relevantDEF.length >  0 || playEntry.scoringPlay == true) {
                    fantasyRelevantPlays.push(playEntry);
                } 
            }
        }
        
        // now that we've filtered our relevant plays, we calculate the fpts each produced
        let fantasyProducts = [];
        let fantasyPlay = {};
        const score = leagueData.scoring_settings;
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
                DEFthreshold = 'score.pts_allow_0';
                DEFdescription = 'Zero Points Allowed';
            } else if(teamScore > 0 && teamScore < 7) {
                DEFscore += (score?.pts_allow_1_6 || 0);
                DEFthreshold = 'score.pts_allow_1_6';
                DEFdescription = 'Points Allowed (1-6)';
            } else if(teamScore > 6 && teamScore < 14) {
                DEFscore += (score?.pts_allow_7_13 || 0);
                DEFthreshold = 'score.pts_allow_7_13';
                DEFdescription = 'Points Allowed (7-13)';
            } else if(teamScore > 13 && teamScore < 21) {
                DEFscore += (score?.pts_allow_14_20 || 0);
                DEFthreshold = 'score.pts_allow_14_20';
                DEFdescription = 'Points Allowed (14-20)';
            } else if(teamScore > 20 && teamScore < 28) {
                DEFscore += (score?.pts_allow_21_27 || 0);
                DEFthreshold = 'score.pts_allow_21_27';
                DEFdescription = 'Points Allowed (21-27)';
            } else if(teamScore > 27 && teamScore < 35) {
                DEFscore += (score?.pts_allow_28_34 || 0);
                DEFthreshold = 'score.pts_allow_28_34';
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
                DEFthreshold = 'score.yds_allow_0_100';
                DEFdescription = 'Yards Allowed (0-99)';
            } else if(teamYards >= 100 && teamYards < 200) {
                DEFscore += (score?.yds_allow_100_199 || 0);
                DEFthreshold = 'score.yds_allow_100_199';
                DEFdescription = 'Yards Allowed (100-199)';
            } else if(teamYards >= 200 && teamYards < 300) {
                DEFscore += (score?.yds_allow_200_299 || 0);
                DEFthreshold = 'score.yds_allow_200_299';
                DEFdescription = 'Yards Allowed (200-299)';
            } else if(teamYards >= 300 && teamYards < 350) {
                DEFscore += (score?.yds_allow_300_349 || 0);
                DEFthreshold = 'score.yds_allow_300_349';
                DEFdescription = 'Yards Allowed (300-349)';
            } else if(teamYards >= 350 && teamYards < 400) {
                DEFscore += (score?.yds_allow_350_399 || 0);
                DEFthreshold = 'score.yds_allow_350_399';
                DEFdescription = 'Yards Allowed (350-399)';
            } else if(teamYards >= 400 && teamYards < 450) {
                DEFscore += (score?.yds_allow_400_449 || 0);
                DEFthreshold = 'score.yds_allow_400_449';
                DEFdescription = 'Yards Allowed (400-449)';
            } else if(teamYards >= 450 && teamYards < 500) {
                DEFscore += (score?.yds_allow_450_499 || 0);
                DEFthreshold = 'score.yds_allow_450_499';
                DEFdescription = 'Yards Allowed (450-499)';
            } else if(teamYards >= 500 && teamYards < 550) {
                DEFscore += (score?.yds_allow_500_549 || 0);
                DEFthreshold = 'score.yds_allow_500_549';
                DEFdescription = 'Yards Allowed (500-549)';
            } else if(teamYards >= 550) {
                DEFscore += (score?.yds_allow_550p || 0);
                DEFthreshold = 'score.yds_allow_550p';
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
                    const entryDEF = {
                        side: 'defense',
                        manager: defense.owner,
                        playerInfo: defense,
                        stat: [curDEFscore.DEFthreshold],
                        fpts,
                        description: play.description,
                        shortDesc: curDEFscore.DEFdescription,
                    }   
                    if(score.pts_allow) {
                        entryDEF.stat.push('pts_allow');
                    } 
                    fantasyPlay[play.playID].push(entryDEF);
                    awayDefPtsAllowed = oldAwayDefPtsAllowed;
                } else if(play.team == away && startersArray.filter(s => s.playerID == home).length > 0) {
                    let oldHomeDefPtsAllowed = homeDefPtsAllowed - play.scoreValue;
                    let curDEFscore = calculateDefPointsAllowed(homeDefPtsAllowed);
                    let oldDEFscore = calculateDefPointsAllowed(oldHomeDefPtsAllowed);
                    const defense = startersArray.filter(s => s.playerID == home)[0];
                    const fpts = curDEFscore.DEFscore - oldDEFscore.DEFscore;
                    const entryDEF = {
                        side: 'defense',
                        manager: defense.owner,
                        playerInfo: defense,
                        stat: [curDEFscore.DEFthreshold],
                        fpts,
                        description: play.description,
                        shortDesc: curDEFscore.DEFdescription,
                    }   
                    if(score.pts_allow) {
                        entryDEF.stat.push('pts_allow');
                    } 
                    fantasyPlay[play.playID].push(entryDEF);   
                    homeDefPtsAllowed = oldHomeDefPtsAllowed;     
                }
            }
            if(play.team == home && startersArray.filter(s => s.playerID == away).length > 0                    // TEAM DEF YARDS ALLOWED
               && (play.playType == 5 || play.playType == 7 || play.playType == 24 || play.playType == 67 || play.playType == 68)) {
                let oldAwayDefYdsAllowed = awayDefYdsAllowed - play.yards;
                let curDEFscore = calculateDefYardsAllowed(awayDefYdsAllowed);
                let oldDEFscore = calculateDefYardsAllowed(oldAwayDefYdsAllowed);
                const defense = startersArray.filter(s => s.playerID == away)[0];
                const fpts = curDEFscore.DEFscore - oldDEFscore.DEFscore;
                const entryDEF = {
                    side: 'defense',
                    manager: defense.owner,
                    playerInfo: defense,
                    stat: [curDEFscore.DEFthreshold],
                    fpts,
                    description: play.description,
                    shortDesc: curDEFscore.DEFdescription,
                }   
                if(score.yds_allow) {
                    entryDEF.stat.push('yds_allow');
                } 
                if(fpts != 0) {
                    fantasyPlay[play.playID].push(entryDEF);
                }                
                awayDefYdsAllowed = oldAwayDefYdsAllowed;
            } else if(play.team == away && startersArray.filter(s => s.playerID == home).length > 0
                      && (play.playType == 5 || play.playType == 7 || play.playType == 24 || play.playType == 67 || play.playType == 68)) {
                        let oldHomeDefYdsAllowed = homeDefYdsAllowed - play.yards;
                        let curDEFscore = calculateDefYardsAllowed(homeDefYdsAllowed);
                        let oldDEFscore = calculateDefYardsAllowed(oldHomeDefYdsAllowed);
                        const defense = startersArray.filter(s => s.playerID == home)[0];
                        const fpts = curDEFscore.DEFscore - oldDEFscore.DEFscore;
                        const entryDEF = {
                            side: 'defense',
                            manager: defense.owner,
                            playerInfo: defense,
                            stat: [curDEFscore.DEFthreshold],
                            fpts,
                            description: play.description,
                            shortDesc: curDEFscore.DEFdescription,
                        }   
                        if(score.yds_allow) {
                            entryDEF.stat.push('yds_allow');
                        } 
                        if(fpts != 0) {
                            fantasyPlay[play.playID].push(entryDEF);
                        }
                        homeDefYdsAllowed = oldHomeDefYdsAllowed;
            }
            if(play.relevantDEF.length > 0) {                   // TEAM DEF/ST FPTS
                let sackRecorded = new Boolean (false);
                for(const relevantKey in play.relevantDEF) {
                    const player = play.relevantDEF[relevantKey];
                    if(player.statType == 'recoverer'
                       && player.playType != 9
                       && play.teamStartPoss != play.teamEndPoss) {                    // FUMBLE RECOVERY PTS - TEAM DEF
                            const fpts = (score?.fum_rec || 0);            // NOTE TO-DO: Must distinguish b/t def & st recoveries
                            const entryDEF = {
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['fum_rec'],
                                fpts,
                                description: play.description,
                                shortDesc: 'Fumble Recovery',
                            }   
                            fantasyPlay[play.playID].push(entryDEF);
                    } 
                    if(player.statType == 'forcedBy') {          // FORCED FUMBLE PTS - TEAM ST
                        if(player.playType == 52 || player.playType == 53 || player.playType == 60) {
                            const fpts = (score?.def_st_ff || 0);
                            const entryDEF = {
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['def_st_ff'],
                                fpts,
                                description: play.description,
                                shortDesc: 'Forced Fumble',
                            }
                            fantasyPlay[play.playID].push(entryDEF);
                        } else {                            // FORCED FUMBLE PTS - TEAM DEF
                            const fpts = (score?.ff || 0);            
                            const entryDEF = {
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['ff'],
                                fpts,
                                description: play.description,
                                shortDesc: 'Forced Fumble',
                            }
                            fantasyPlay[play.playID].push(entryDEF);
                        }
                    }
                    if(player.statType == 'sackedBy' && sackRecorded == false) {            // SACK - TEAM DEF
                        const fpts = (score?.sack || 0) + player.yards * (score?.sack_yd || 0);
                        const entryDEF = {
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['sack', 'sack_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Sack',
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                        sackRecorded = true;       // so that split-sacks aren't counted twice
                    }
                    if(player.playType == 26 && player.statType == 'returner') {            // INT TEAM DEF
                        const fpts = (score?.int || 0) + player.yards * (score?.int_ret_yd || 0);
                        const entryDEF = {
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['int', 'int_ret_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Interception',
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    } 
                    if(player.playType == 36 && player.statType == 'scorer') {        // P6 TEAM DEF
                        const fpts = (score?.def_td || 0) + (score?.int || 0) + player.yards * (score?.int_ret_yd || 0);
                        const entryDEF = {
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['def_td', 'int', 'int_ret_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Pick Six',
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    }   
                    if(player.playType == 53 && player.statType == 'returner') {                  // KICKOFF RETURN YDS TEAM DEF/ST
                        const fpts = player.yards * (score?.def_kr_yd || 0);
                        const entryDEF = {
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['def_kr_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Kickoff Return',
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    }      
                    if(player.playType == 52 && player.statType == 'returner') {                  // PUNT - TEAM DEF/ST
                        const fpts = player.yards * (score?.def_pr_yd || 0) + (score?.def_forced_punts || 0);
                        const entryDEF = {
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['def_pr_yd', 'def_forced_punt'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Punt',
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    }    
                    if(player.playType == 32 && player.statType == 'returner') {                  // KICK 6 - TEAM DEF/ST
                        const fpts = player.yards * (score?.def_kr_yd || 0) + (score?.def_st_td || 0);
                        const entryDEF = {
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['def_kr_yd', 'def_st_td'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Kick Six',
                        }
                        fantasyPlay[play.playID].push(entryDEF);
                    }    
                    if(player.playType == 60 && play.description.includes('BLOCKED')) {                  // BLOCKED FIELD GOAL - TEAM DEF/ST
                        const fpts = (score?.blk_kick || 0);   // TO-DO: add blk kick return yards (ESPN's statYardage norrmally represents kick distance)
                        const entryDEF = {
                            side: 'defense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['blk_kick'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Blocked Field Goal',
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
                        const entry = {
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['fum'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Fumble',
                        }                   
                        if(play.teamStartPoss != play.teamEndPoss && score.fum_lost) {      // PENALTY for FUMBLE -> TURNOVER
                            entry.fpts += score.fum_lost;                                   // note that it's not necessarily one or the other
                            entry.stat.push('fum_lost');
                            entry.shortDesc += ' (Fumble Turnover)';
                        }
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.statType == 'recoverer'
                            && player.playType != 9 
                            && play.teamStartPoss != play.teamEndPoss) {   
                                if(score.idp_fum_rec) {                                 // FUMBLE RECOVERY IDP
                                    const entryIDP = {
                                        side: 'defense',
                                        manager: player.manager,
                                        playerInfo: player.playerInfo,
                                        stat: ['idp_fum_rec'],
                                        fpts: score.idp_fum_rec,
                                        description: play.description,
                                        shortDesc: 'Fumble Recovery',
                                    }
                                    fantasyPlay[play.playID].push(entryIDP);
                                }
                    } else if(player.statType == 'forcedBy' // TO-DO make sure ALL potential fpts-scoring plays are calculated - we'll filter out the ones the leaague doesn't count later
                            && player.playType != 53 // no kickoffs or punts (TO-DO: field goals)
                            && player.playType != 52) {  
                                if(player.playType == 9) {                        // FUMBLE FORCED PTS - IDP
                                    const fpts = (score?.idp_ff || 0);            
                                    const entryIDP = {
                                        side: 'defense',
                                        manager: player.manager,
                                        playerInfo: player.playerInfo,
                                        stat: ['idp_ff'],
                                        fpts,
                                        description: play.description,
                                        shortDesc: 'Forced Fumble',
                                    }
                                    fantasyPlay[play.playID].push(entryIDP);
                                }  
                    }
                    if(player.playType == 5 && player.statType == 'rusher') {         // RUSH
                        const fpts = player.yards * (score?.rush_yd || 0) + (score?.rush_att || 0);
                        const entry = {
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['rush_yd', 'rush_att'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Rush',
                        }
                        if(player.yards >= 40 && score.rush_40p) {          // RUSH YD BONUS
                            entry.fpts += score.rush_40p;
                            entry.stat.push('rush_40p');
                        }
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.playType == 68 && player.statType == 'rusher') {            // RUSH TD  NOTE TO-DO: ACCOUNT FOR LATERALS (SAME WITH REC TDs)
                        const fpts = player.yards * (score?.rush_yd || 0) + (score?.rush_att || 0) + (score?.rush_td || 0);
                        const entry = {
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['rush_yd', 'rush_att', 'rush_td'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Rushing Touchdown',
                        }
                        if(40 <= player.yards && player.yards < 50 && score.rush_td_40p) {          // RUSH TD YD BONUS
                            entry.fpts += score.rush_td_40p;
                            entry.stat.push('rush_td_40p');
                        } else if(player.yards >= 50 && score.rush_td_50p) {
                            entry.fpts += score.rush_td_50p;
                            entry.stat.push('rush_td_50p');
                        }
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.playType == 26) {          // INTERCEPTION
                        if(player.statType == 'passer') {                       // INT QB PENALTY
                            const fpts = (score?.pass_int || 0) + (score?.pass_att || 0);
                            const entry = {
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_int', 'pass_att'],
                                fpts,
                                description: play.description,
                                shortDesc: 'Interception Thrown',
                            }  
                            fantasyPlay[play.playID].push(entry);
                        }       
                    } else if(player.playType == 36) {            // PICK SIX 
                        if(player.statType == 'scorer' && (score.idp_int || score.idp_def_td || score.idp_int_ret_yd)) {        // P6 IDP
                            const fpts = (score?.idp_int || 0) + (score?.idp_def_td || 0) + player.yards * (score?.idp_int_ret_yd || 0);
                            const entryIDP = {
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['idp_int', 'idp_def_td', 'idp_int_ret_yd'],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Pick Six',
                            }
                            if(player.yards >= 50 && score.bonus_def_int_td_50p) {                  // P6 IDP YD BONUS
                                entryIDP.fpts += score.bonus_def_int_td_50p;
                                entryIDP.stat.push('bonus_def_int_td_50p');
                            }
                            fantasyPlay[play.playID].push(entryIDP);
                        }   
                        if(player.statType == 'passer') {                       // P6 QB PENALTY
                            const fpts = (score?.pass_int || 0) + (score?.pass_inc || 0) + (score?.pass_int_td || 0) + (score?.pass_att || 0);
                            const entry = {
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_int', 'pass_inc', 'pass_int_td', 'pass_att'],
                                fpts,
                                description: play.description,
                                shortDesc: 'Pick Six Thrown',
                            }  
                            fantasyPlay[play.playID].push(entry);
                        } 
                    } else if(player.playType == 24) {          // COMPLETE PASS
                        if(player.statType == 'passer') {
                            const fpts = player.yards * (score?.pass_yd || 0) + (score?.pass_att || 0) + (score?.pass_cmp || 0);
                            const entry = {
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_yd', 'pass_att', 'pass_cmp'],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Pass Complete',
                            }      
                            if(player.yards >= 40 && score.pass_cmp_40p) {          // PASS YD BONUS
                                entry.fpts += score.pass_cmp_40p;
                                entry.stat.push('pass_cmp_40p');
                            }
                            fantasyPlay[play.playID].push(entry);
                        } else if(player.statType == 'receiver') {              // RECEPTION
                            const fpts = player.yards * (score?.rec_yd || 0) + (score?.rec || 0);
                            const entry = {
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['rec_yd', 'rec'],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Reception',
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
                            if(player.playerInfo.pos == 'RB' && score.bonus_rec_rb) {   // RECEPTION POS BONUS
                                entry.fpts += score.bonus_rec_rb;
                                entry.stat.push('bonus_rec_rb');
                            } else if(player.playerInfo.pos == 'TE' && score.bonus_rec_te) {   
                                entry.fpts += score.bonus_rec_te;
                                entry.stat.push('bonus_rec_te');
                            } else if(player.playerInfo.pos == 'WR' && score.bonus_rec_wr) {   
                                entry.fpts += score.bonus_rec_wr;
                                entry.stat.push('bonus_rec_wr');
                            }
                            fantasyPlay[play.playID].push(entry);
                        }         
                    } else if(player.playType == 67) {                         // PASSING TD
                        if(player.statType == 'passer') {
                            const fpts = player.yards * (score?.pass_yd || 0) + (score?.pass_td || 0) + (score?.pass_cmp || 0) + (score?.pass_att || 0);
                            const entry = {
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_yd', 'pass_td', 'pass_cmp', 'pass_att'],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Passing Touchdown',
                            }
                            if(40 <= player.yards && player.yards < 50 && score.pass_td_40p) {          // PASSING TD YD BONUS
                                entry.fpts += score.pass_td_40p;
                                entry.stat.push('pass_td_40p');
                            } else if(player.yards >= 50 && score.pass_td_50p) {
                                entry.fpts += score.pass_td_50p;
                                entry.stat.push('pass_td_50p');
                            }
                            fantasyPlay[play.playID].push(entry);
                        } else if(player.statType == 'receiver') {                // RECEIVING TD
                            const fpts = player.yards * (score?.rec_yd || 0) + (score?.rec_td || 0) + (score?.rec || 0);
                            const entry = {
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['rec_yd', 'rec_td', 'rec'],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Receiving Touchdown',
                            }
                            if(40 <= player.yards && player.yards < 50 && score.rec_td_40p) {          // RECEIVING TD YD BONUS
                                entry.fpts += score.rec_td_40p;
                                entry.stat.push('rec_td_40p');
                            } else if(player.yards >= 50 && score.rec_td_50p) {
                                entry.fpts += score.rec_td_50p;
                                entry.stat.push('rec_td_50p');
                            }
                            fantasyPlay[play.playID].push(entry);
                        }
                    } else if(player.playType == 3 && player.statType == 'passer') {         // INCOMPLETE PASS
                        const fpts = (score?.pass_inc || 0) + (score?.pass_att || 0);
                        const entry = {
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['pass_inc', 'pass_att'],
                            fpts,
                            description: play.description,
                            shortDesc: 'Pass Incomplete',
                        }
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.playType == 7) {         // SACK - QB
                        if(player.statType == 'passer' && score.pass_sack) {
                            const fpts = score.pass_sack;
                            const entry = {
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['pass_sack'],
                                fpts,
                                description: play.description,
                                shortDesc: 'Sacked',
                            }
                            fantasyPlay[play.playID].push(entry);
                        }
                    } else if(player.playType == 59 && player.statType == 'kicker') {         // MADE FIELD GOAL
                        const fpts = (score?.fgm || 0) + player.yards * (score?.fgm_yds || 0);
                        const entry = {
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['fgm', 'fgm_yds'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Field Goal Made',
                        }
                        if(0 < player.yards && player.yards < 20 && score.fgm_0_19) {           // FG YD BONUS
                            entry.fpts += score.fgm_0_19;
                            entry.stat.push(score.fgm_0_19);
                        } else if(19 < player.yards && player.yards < 30 && score.fgm_20_29) {
                            entry.fpts += score.fgm_20_29;
                            entry.stat.push(score.fgm_20_29);
                        } else if(29 < player.yards) {
                            if(score.fgm_yds_over_30) {
                                entry.fpts += score.fgm_yds_over_30;
                                entry.stat.push(score.fgm_yds_over_30);
                            }
                            if(player.yards < 40 && score.fgm_30_39) {
                                entry.fpts += score.fgm_30_39;
                                entry.stat.push(score.fgm_30_39);
                            } else if(39 < player.yards && player.yards < 50 && score.fgm_40_49) {
                                entry.fpts += score.fgm_40_49;
                                entry.stat.push(score.fgm_40_49);
                            } else if(player.yards >= 50 && score.fgm_50p) {
                                entry.fpts += score.fgm_50p;
                                entry.stat.push(score.fgm_50p);
                            } 
                        }        
                        fantasyPlay[play.playID].push(entry);
                    } else if(player.playType == 60 && player.statType == 'kicker') {           // MISSED FIELD GOAL
                        const fpts = (score?.fgmiss || 0);
                        const entry = {
                            side: 'offense',
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['fgmiss'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                            shortDesc: 'Field Goal Missed',
                        }   
                        if(0 < player.yards && player.yards < 20 && score.fgmiss_0_19) {           // MISSED FG YD PENALTY
                            entry.fpts += score.fgmiss_0_19;
                            entry.stat.push(score.fgmiss_0_19);
                        } else if(19 < player.yards && player.yards < 30 && score.fgmiss_20_29) {
                            entry.fpts += score.fgmiss_20_29;
                            entry.stat.push(score.fgmiss_20_29);     
                        } else if(29 < player.yards && player.yards < 40 && score.fgmiss_30_39) {
                            entry.fpts += score.fgmiss_30_39;
                            entry.stat.push(score.fgmiss_30_39); 
                        } else if(39 < player.yards && player.yards < 50 && score.fgmiss_40_49) {
                            entry.fpts += score.fgmiss_40_49;
                            entry.stat.push(score.fgmiss_40_49);    
                        } else if(player.yards >= 50 && score.fgmiss_50p) {
                            entry.fpts += score.fgmiss_50p;
                            entry.stat.push(score.fgmiss_50p);  
                        } 
                        fantasyPlay[play.playID].push(entry);                                                        // TO-DO (maybe) NOTE: ADD IF OTHER KINDS OF TOUCHDOWNS  ALSO NOT SURE IF THIS WORKS;       
                    } else if(((player.playType == 68 || player.playType == 67) || play.scoringType == 'touchdown') // MISSED PAT
                                && !play.description.includes('extra point is GOOD')
                                && !play.description.includes('Kick)')
                                && player.statType == 'patScorer') {
                                    const fpts = (score?.xpmiss || 0);
                                    const entry = {
                                        side: 'offense',
                                        manager: player.manager,
                                        playerInfo: player.playerInfo,
                                        stat: ['xpmiss'],
                                        fpts,
                                        description: play.description,
                                        shortDesc: 'PAT Missed',
                                    }   
                                    fantasyPlay[play.playID].push(entry);                                                                                    
                    } else if(((player.playType == 68 || player.playType == 67) || play.scoringType == 'touchdown') // MADE PAT
                                && (play.description.includes('extra point is GOOD') || play.description.includes('Kick)'))
                                && player.statType == 'patScorer') {
                                    const fpts = (score?.xpm || 0);
                                    const entry = {
                                        side: 'offense',
                                        manager: player.manager,
                                        playerInfo: player.playerInfo,
                                        stat: ['xpm'],
                                        fpts,
                                        description: play.description,
                                        shortDesc: 'PAT Made',
                                    }   
                                    fantasyPlay[play.playID].push(entry);                                                                                    
                    } else if(player.playType == 12) {
                        if(player.statType == 'returner') {
                            const fpts = player.yards * (score?.kr_yd || 0);
                            const entry = {
                                side: 'offense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['kr_yd'],
                                fpts,
                                yards: player.yards,
                                description: play.description,
                                shortDesc: 'Kick Return',
                            }
                            fantasyPlay[play.playID].push(entry);
                        }
                    }   
                }                      
            }
            fantasyProducts.push(fantasyPlay[play.playID]);
        }
        // if DEF started, push entry for their starting points
        if(startersArray.filter(s => s.playerID == home).length > 0 || startersArray.filter(s => s.playerID == away).length > 0) {
            if(startersArray.filter(s => s.playerID == home).length > 0) {
                const fpts = (score?.pts_allow_0 || 0) + (score?.yds_allow_0_100 || 0);
                const team = startersArray.filter(s => s.playerID == home)[0];
                const entryDEF = {
                    side: 'defense',
                    manager: team.owner,
                    playerInfo: team,
                    stat: ['pts_allow_0', 'yds_allow_0_100'],
                    fpts,
                    description: 'GAME BEGINS - DEF has allowed 0 points, 0 yards',
                    shortDesc: 'DEF Starting',
                }   
                fantasyPlay[9999999] = [];
                fantasyPlay[9999999].push(entryDEF);
                fantasyProducts.push(fantasyPlay[9999999]);
            }
            if(startersArray.filter(s => s.playerID == away).length > 0) {
                const fpts = (score?.pts_allow_0 || 0) + (score?.yds_allow_0_100 || 0);
                const team = startersArray.filter(s => s.playerID == away)[0];
                const entryDEF = {
                    side: 'defense',
                    manager: team.owner,
                    playerInfo: team,
                    stat: ['pts_allow_0', 'yds_allow_0_100'],
                    fpts,
                    description: 'GAME BEGINS - DEF has allowed 0 points, 0 yards',
                    shortDesc: 'DEF Starting',
                }   
                fantasyPlay[9999999] = [];
                fantasyPlay[9999999].push(entryDEF);
                fantasyProducts.push(fantasyPlay[9999999]);
            }
        }
        
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
        height: 130.7em;
		background-color: var(--f3f3f3);
        overflow-y: auto;
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
        left: 4em;
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
                        {#if fantasyProduct[0] && fantasyProduct[0]?.fpts != 0}
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
