<script>
    import { getPlayByPlay, waitForAll, round, getGameDrives } from '$lib/utils/helper'; 
    import LinearProgress from '@smui/linear-progress';

    export let newLoading, nflTeams, nflMatchups, yearLeagueData, fantasyStarters, managerInfo, weekMatchups, playersInfo, gameSelection, matchSelection, managerSelection, fantasyProducts, viewPlayerID, showGameBox, showMatchBox, leaderBoardInfo, weekSelection, yearSelection;

    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/situation?lang=en&region=us CURRENT DOWN
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/plays?lang=en&region=us PLAY BY PLAY
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/competitors/22/statistics?lang=en&region=us GAME STATS
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436?lang=en&region=us GAME
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks ALL WEEKS
    // 4035687
    let startersArray = [];

    const loadPlayByPlay = async (gameSelection, matchSelection, startersArray, showGameBox, showMatchBox) => {

        let fantasyProducts = [];
        const score = yearLeagueData.scoring_settings;
        const positions = yearLeagueData.roster_positions.filter(p => p != 'BN');

        // extracts Espn Team ID from API link
        const parseEspnTeamID = async (teamLink, linkType) => {
            let espnTeamID;
            if(linkType == 'play') {
                if(teamLink.slice(82, 84)[1] != '?') {
                    espnTeamID = teamLink.slice(82, 84);
                } else {
                    espnTeamID = teamLink.slice(82, 83);
                }
            } else if(linkType == 'participants' || linkType == 'info') {

                const espnPlayerLink = 'https' + teamLink.slice(4); 
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

                if(espnPlayerData[0].team.$ref.slice(82, 84)[1] != '?') {
                    espnTeamID = espnPlayerData[0].team.$ref.slice(82, 84);
                } else {
                    espnTeamID = espnPlayerData[0].team.$ref.slice(82, 83);
                }

                if(linkType == 'info') {
                    const espnPlayerInfo = {
                        fn: espnPlayerData[0].firstName,
                        ln: espnPlayerData[0].lastName,
                        pos: espnPlayerData[0].position.abbreviation,  
                        t: espnTeamID
                    }
                    espnTeamID = espnPlayerInfo;
                }
            }
            return espnTeamID;
        }

        // determines whether play counts w.r.t. yards, penalties, etc.
        const checkNoPlay = (playType, playDescription) => {
            let noPlay = new Boolean (false);
            if(playType == 8 || playDescription.includes('No Play.') || playType == 2 || playType == 21 || playType == 65 || playType == 66 || playType == 70 || playType == 74 || playType == 75) {
                noPlay = true;
            } else {
                noPlay = false;
            }
            return noPlay;
        }

        // flags injuries to starters
        const checkInjury = (playDescription, relevantStartersArray) => {
            let injuredPlayer;
            if(!playDescription.includes('were injured')) {
                injuredPlayer = playDescription.slice(0, playDescription.indexOf(' was injured'))
                injuredPlayer = injuredPlayer.split('');
                injuredPlayer = injuredPlayer.reverse();
                injuredPlayer = injuredPlayer.join('');

                let injuryTeam = injuredPlayer.slice(0, injuredPlayer.indexOf('-') + 4);
                injuredPlayer = injuredPlayer.slice(0, injuredPlayer.indexOf('-'));

                injuryTeam = injuryTeam.split('');
                injuryTeam = injuryTeam.reverse();
                injuryTeam = injuryTeam.join('');
                if(injuryTeam[0] == ' ') {
                    injuryTeam = injuryTeam.slice(1, injuryTeam.indexOf('-'));
                } else {
                    injuryTeam = injuryTeam.slice(0, injuryTeam.indexOf('-'));
                }

                injuredPlayer = injuredPlayer.split('');
                injuredPlayer = injuredPlayer.reverse();
                injuredPlayer = injuredPlayer.join('');
                let firstInitial = injuredPlayer[0];
                let surname = injuredPlayer.slice(injuredPlayer.indexOf('.') + 1);

                if(relevantStartersArray.find(s => s.ln == surname && s.t == injuryTeam && s.fn.slice(0, 1) == firstInitial)) {
                    injuredPlayer = relevantStartersArray.find(s => s.ln == surname && s.t == injuryTeam && s.fn.slice(0, 1) == firstInitial);
                } else {
                    injuredPlayer = null;
                }
            }
            return injuredPlayer;
        }   

        // checks whether play is relevant to Team DEF/ST scoring
        const isDefRelevant = (play, playType, playTeam, homeDefStarted, awayDefStarted, home, away, homeDefense, awayDefense, playerKey, playerTeam) => {
            let relevantEntry;
            if(playType == 7 || playType == 9 || playType == 26 ||     
                playType == 36 || playType == 52 || playType == 12 ||   
                playType == 32 || playType == 17 || playType == 29 ||
                playType == 37 || playType == 39 || playType == 18 ||
                playType == 20 || play.pointAfterType == 43 ||
                (playType == 60 && play.alternativeText.includes('BLOCKED'))) {    

                if(awayDefStarted == true && playTeam == home && playerTeam == away) {
                    const defense = awayDefense;
                    relevantEntry = {
                        playerInfo: defense,
                        manager: defense.owner,
                        statType: play.participants[playerKey].type,
                        yards: play.statYardage, 
                        playType: playType,
                        oppDef: away,
                    }
                } else if(homeDefStarted == true && playTeam == away && playerTeam == home) {
                    const defense = homeDefense;
                    relevantEntry = {
                        playerInfo: defense,
                        manager: defense.owner,
                        statType: play.participants[playerKey].type,
                        yards: play.statYardage, 
                        playType: playType,
                        oppDef: home,
                    }
                }
            } else {
                relevantEntry = null;
            }
            return relevantEntry;
        }
        // games with laterals: Lions-Steelers (2021-10), Bills-Jets (2021-10), Colts-Jets (2021-9), Dolphins-Texans (2021-9)
        // determines true stat yardage on plays involving laterals - TO-DO: much stupid work to process "circus plays" ; also other types of plays besides pass
        const processLateral = (play, player, relevantStartersArray) => {
            const lateralInfo = [];

            if(player.playType == 24 || play.secondDescription.includes('Pass for')) {
                let lateralCount = 1;

                let moreLaterals = true;
                let countCheck = play.description.slice(play.description.indexOf('Lateral') + 7);
                while(moreLaterals == true) {
                    if(countCheck.includes('Lateral')) {
                        lateralCount++;
                        countCheck = countCheck.slice(play.description.indexOf('Lateral') + 7);
                    } else {
                        moreLaterals = false;
                    }
                }


                let firstPlayerIndex = play.description.indexOf('.', play.description.indexOf('.') + 1);
                let firstPlayer = play.description.slice(firstPlayerIndex - 2, play.description.indexOf('. '));
                let firstPlayerInitial;
                if(firstPlayer[0] == ' ') { 
                    firstPlayerInitial = firstPlayer.slice(1, 2);
                } else {
                    firstPlayerInitial = firstPlayer.slice(0, 1);
                }
                let firstPlayerSurname = firstPlayer.slice(firstPlayer.indexOf('.') + 1, firstPlayer.indexOf('to') - 1);
                let firstPlayerYards = null;

                firstPlayerYards = play.description.slice(play.description.indexOf('yards') - 3, play.description.indexOf('yards') - 1);
                if(firstPlayerYards[0] == ' ') {
                    firstPlayerYards = firstPlayerYards.slice(1)
                }
                firstPlayerYards = parseInt(firstPlayerYards);

                let lateralPlayerArray = [];
                let lateralPlayer = play.description.slice();
                while(lateralCount > 0) {
                    lateralPlayer = lateralPlayer.slice(lateralPlayer.indexOf('Lateral') + 11);

                    let lateralPlayerInitial = lateralPlayer.slice(0, 1);
                    let lateralPlayerSurname = lateralPlayer.slice(lateralPlayer.indexOf('.') + 1, lateralPlayer.indexOf(' '));

                    let lateralPlayerYards = lateralPlayer.slice(lateralPlayer.indexOf(' yards') - 2, lateralPlayer.indexOf(' yards'));
                    if(lateralPlayerYards[0] == ' ') {
                        lateralPlayerYards = lateralPlayerYards.slice(1);
                    }
                    lateralPlayerYards = parseInt(lateralPlayerYards);

                    lateralPlayerArray.push({
                        initial: lateralPlayerInitial,
                        surname: lateralPlayerSurname,
                        yards: lateralPlayerYards,
                    });

                    lateralCount--;
                }

                let totalLateralYards = 0;
                for(const player in lateralPlayerArray) {
                    totalLateralYards += lateralPlayerArray[player].yards;
                }
                
                let lastPlayerYards = lateralPlayerArray[0].yards;
                if(lateralCount == 1) {
                    if(firstPlayerYards < 0 && player.yards > 0) {
                        firstPlayerYards = 0;
                        lastPlayerYards = player.yards;
                    } else if((firstPlayerYards < 0 && player.yards <= 0) || (firstPlayerYards > 0 && lastPlayerYards == 0 && firstPlayerYards > player.yards)) {
                        firstPlayerYards = player.yards;
                        lastPlayerYards = 0;
                    } else if(firstPlayerYards > 0 && firstPlayerYards > player.yards && lateralPlayerYards > 0) {
                        firstPlayerYards = firstPlayerYards - lastPlayerYards;
                    } else if(firstPlayerYards > 0 && firstPlayerYards > player.yards && lastPlayerYards < 0) {
                        firstPlayerYards = player.yards - lastPlayerYards;
                    } else if(firstPlayerYards > 0 && firstPlayerYards < player.yards && (player.yards - lastPlayerYards < 0)) {
                        firstPlayerYards += player.yards - lastPlayerYards;
                    }
                } else {
                    // calculate firstPlayer's yards first
                    if(firstPlayerYards < 0 && player.yards > 0) {
                        firstPlayerYards = 0;
                    } else if((firstPlayerYards < 0 && player.yards <= 0) || (firstPlayerYards > 0 && totalLateralYards == 0 && firstPlayerYards > player.yards)) {
                        firstPlayerYards = player.yards;
                    } else if(firstPlayerYards > 0 && firstPlayerYards > player.yards && totalLateralYards > 0) {
                        firstPlayerYards = firstPlayerYards - totalLateralYards;
                    } else if(firstPlayerYards > 0 && firstPlayerYards > player.yards && totalLateralYards < 0) {
                        firstPlayerYards = player.yards - totalLateralYards;
                    } else if(firstPlayerYards > 0 && firstPlayerYards < player.yards && (player.yards - totalLateralYards < 0)) {
                        firstPlayerYards += player.yards - totalLateralYards;
                    }

                    // now each lateralee (super hacky & assumes ball gets past line of scrimmage after 3 laterals)
                    // if(firstPlayerYards < 0 && lateralPlayerArray[0].yards + firstPlayerYards <= 0) {
                    //     lateralPlayerArray[0].yards = 0;
                    //     if(lateralPlayerArray[0].yards + firstPlayerYards + lateralPlayerArray[1].yards <= 0) {
                    //         lateralPlayerArray[1].yards = 0
                    //         if(lateralPlayerArray[2] && (lateralPlayerArray[0].yards + firstPlayerYards + lateralPlayerArray[1].yards + lateralPlayerArray[2].yards <= 0)) {
                    //             lateralPlayerArray[2].yards = 0;
                    //         } else if(lateralPlayerArray[2]) {
                    //             lateralPlayerArray[2].yards += firstPlayerYards
                    //             let priorYards = firstPlayerYards;
                    //             let priorLaterals = lateralPlayerArray.slice();
                    //             while(priorYards < 0) {
                    //                 priorYards += priorLaterals[0].yards;
                    //                 if(priorYards > 0) {
                    //                     lateralPlayerArray[2].yards += priorLaterals[0].yards - priorYards;
                    //                 }
                    //                 priorLaterals = priorLaterals.shift()
                    //             }

                    //             if(firstPlayerYards + lateralPlayerArray[0].yards < 0) {
                    //                 lateralPlayerArray[2].yards += firstPlayerYards + lateralPlayerArray[i].yards;
                    //             }
                    //         }
                    //     }
                    // } 
                }

                if(relevantStartersArray.find(s => s.ln == firstPlayerSurname && s.t == play.playTeam && s.fn.slice(1) == firstPlayerInitial)) {
                    firstPlayer = relevantStartersArray.find(s => s.ln == firstPlayerSurname && s.t == play.playTeam && s.fn.slice(1) == firstPlayerInitial);
                    lateralInfo.push({
                        player: firstPlayer,
                        yards: firstPlayerYards,
                        stats: ['rec', 'rec_yd'],
                    });
                }

                if(lateralCount > 1) {
                    for(let i = 0; i < lateralPlayerArray.length - 1; i++) {
                        if(relevantStartersArray.find(s => s.ln == lateralPlayerArray[i].surname && s.t == play.playTeam && s.fn.slice(1) == lateralPlayerArray[i].initial)) {
                            let lateralPlayer = relevantStartersArray.find(s => s.ln == lateralPlayerArray[i].surname && s.t == play.playTeam && s.fn.slice(1) == lateralPlayerArray[i].initial);
                            lateralInfo.push({
                                player: lateralPlayer,
                                yards: lateralPlayerArray[i].yards,
                                stats: ['rec_yd'],
                            });
                        }
                    }
                }
                
                lateralInfo.push({
                    player: player,
                    yards: lastPlayerYards,
                    stats: ['rec_yd'],
                });
            }
            return lateralInfo;
        }

        // extracts enforced penalty yardage from play description 
        const getTruePenalty = (playTeam, oppTeam, description, secondDescription, playType, playYardage) => {
            let truePenaltyInfo = {
                penalties: [],
                totalYards: 0,
                against: null,
                trueYards: 0,
                spotEnforced: null,
            };

            if(description.includes(`PENALTY on ${playTeam}`)) {
                truePenaltyInfo.against = playTeam;
            } else {
                truePenaltyInfo.against = oppTeam;
            }

            truePenaltyInfo.spotEnforced = description.slice(description.indexOf('enforced at') + 12, description.length - 1);

            // && description.indexOf('Unnecessary Roughness') - description.indexOf(`PENALTY on ${espnAbbv}`) > 0 
            //     && description.indexOf('Unnecessary Roughness') - description.indexOf(`PENALTY on ${espnAbbv}`) < 50)            
            
            if(description.includes('Roughing the Passer')) {
                let penaltyYards;
                if(playType == 24) {
                    let trueYards = secondDescription.slice(secondDescription.indexOf('Pass for') + 9, secondDescription.indexOf('Pass for') + 11);
                    if(trueYards[trueYards.length - 1] == ' ') {
                        trueYards = trueYards.slice(0, 1);
                    }
                    trueYards = parseInt(trueYards);
                    penaltyYards = playYardage - trueYards;
                } else if(description.includes('(15 Yards)')) {        
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
                let penaltyYards = description.slice(description.indexOf('Unnecessary Roughness') + 23, description.indexOf('Unnecessary Roughness') + 25);
                if(penaltyYards[1] == ' ') {
                    penaltyYards = penaltyYards.slice(0, 1);
                }
                truePenaltyInfo.penalties.push(parseInt(penaltyYards));
            }
            if(description.includes('Taunting')){
                let penaltyYards = description.slice(description.indexOf('Taunting') + 10, description.indexOf('Taunting') + 12);
                if(penaltyYards[1] == ' ') {
                    penaltyYards = penaltyYards.slice(0, 1);
                }
                truePenaltyInfo.penalties.push(parseInt(penaltyYards));
            }
            if(description.includes('Defensive Holding')){
                let penaltyYards = description.slice(description.indexOf('Defensive Holding') + 19, description.indexOf('Defensive Holding') + 21);
                if(penaltyYards[1] == ' ') {
                    penaltyYards = penaltyYards.slice(0, 1);
                }
                truePenaltyInfo.penalties.push(parseInt(penaltyYards));
            }
            if(description.includes('Offensive Holding')){
                let penaltyYards = description.slice(description.indexOf('Offensive Holding') + 19, description.indexOf('Offensive Holding') + 21);
                if(penaltyYards[1] == ' ') {
                    penaltyYards = penaltyYards.slice(0, 1);
                }
                truePenaltyInfo.penalties.push(parseInt(penaltyYards));
            }
            if(description.includes('Illegal Block Above the Waist')){
                let penaltyYards = description.slice(description.indexOf('Waist') + 7, description.indexOf('Waist') + 9);
                if(penaltyYards[1] == ' ') {
                    penaltyYards = penaltyYards.slice(0, 1);
                }
                truePenaltyInfo.penalties.push(parseInt(penaltyYards));
            }
            if(description.includes('Horse Collar')){
                let penaltyYards = description.slice(description.indexOf('Collar') + 8, description.indexOf('Collar') + 10);
                if(penaltyYards[1] == ' ') {
                    penaltyYards = penaltyYards.slice(0, 1);
                }
                truePenaltyInfo.penalties.push(parseInt(penaltyYards));
            }
            if(description.includes('Disqualification')){
                let penaltyYards = description.slice(description.indexOf('Disqualification') + 18, description.indexOf('Disqualification') + 20);
                if(penaltyYards[1] == ' ') {
                    penaltyYards = penaltyYards.slice(0, 1);
                }
                truePenaltyInfo.penalties.push(parseInt(penaltyYards));
            }

            if(playType == 5 || playType == 9 || playType == 29 || playType == 39) {
                // if(!secondDescription.includes('Yrd Rush')) {
                //     let trueYards = description.slice(description.indexOf('for ') + 4, description.indexOf('for ') + 6);
                //     if(trueYards[trueYards.length - 1] == ' ') {
                //         trueYards = trueYards.slice(0, 1);
                //     }
                //     trueYards = parseInt(trueYards);
                //     let trueSpot = description.slice(description.indexOf(' for ') - 6, description.indexOf(' for '));
                //     if(trueSpot[0] == ' ') {
                //         trueSpot = trueSpot.slice(1);
                //     } else if(trueSpot[0] == 't') {
                //         trueSpot = trueSpot.slice(2);
                //     }

                //     let trueSpotSide = trueSpot.slice(0, trueSpot[trueSpot.length - 2]).filter(c => c != ' ');
                //     let trueSpotYard = parseInt(trueSpot.slice(trueSpot[trueSpot.length - 2]));

                //     let spotEnforcedSide = spotEnforced.slice(0, spotEnforced[spotEnforced.length - 2]).filter(c => c != ' ');
                //     let spotEnforcedYard = parseInt(spotEnforced.slice(spotEnforced[spotEnforced.length - 2]))
                    
                //     if(trueYards > 0                                // positive gain before penalty enforced
                //         && truePenaltyInfo.against == playTeam      // penalty against rushing team
                //         && spotEnforcedSide == trueSpotSide         // ball didn't cross 50
                //         && trueSpotYard > spotEnforcedYard          // spot of enforcement behind line of gain
                //         && spotEnforcedSide == playTeam) {          // rushing team is on own side
                //             let lineScrimmage = trueSpotYard - trueYards;
                //             trueYards = spotEnforcedYard - lineScrimmage;
                //     }
                //     truePenaltyInfo.trueYards = trueYards;
                // } else {
                    let trueYards;
                    if(secondDescription.includes('Yrd Rush')) {
                        trueYards = secondDescription.slice(secondDescription.indexOf(' Yrd Rush') - 2, secondDescription.indexOf(' Yrd Rush'))
                        if(trueYards[0] == ' ') {
                            trueYards = trueYards.slice(1);
                        }
                        truePenaltyInfo.trueYards = parseInt(trueYards);
                    } else if(secondDescription.includes('Loss of')) {
                        trueYards = secondDescription.slice(secondDescription.indexOf('Loss of') + 8, secondDescription.indexOf('Loss of') + 10);
                        if(trueYards[1] == ' ') {
                            trueYards = trueYards.slice(0, 1);
                        }
                        trueYards = parseInt(trueYards) * (-1);
                        truePenaltyInfo.trueYards = trueYards;
                    }

                // }
            }



            for(let i = 0; i < truePenaltyInfo.penalties.length; i++) {
                truePenaltyInfo.totalYards += truePenaltyInfo.penalties[i];
            }

            return truePenaltyInfo;
        }
        // processes DEF yards allowed ....TO-DO: Net yards when turnovers (fumble/int), yards before and after fumble + own recovery, etc.
        const defensiveYards = (homeTeam, awayTeam, homeStart, homeYards, awayStart, awayYards, playObj) => {
            let defensiveYardsInfo = {
                defYdsThreshBreakers: [],
                newAwayYards: awayYards,
                newHomeYards: homeYards,
            };

            if(playObj.team == homeTeam) { 

                if(awayStart == true) {
                    let oldYA = defensiveYardsInfo.newAwayYards;

                    if((playObj.playType == 5 || playObj.playType == 7 || playObj.playType == 9 || playObj.playType == 20 || playObj.playType == 24 || playObj.playType == 67 || playObj.playType == 68)) {
                        
                        if(playObj.playType == 5) {
                            if(playObj.penalty == true) {
                                defensiveYardsInfo.newAwayYards += playObj.penaltyInfo.trueYards;
                            } else {
                                defensiveYardsInfo.newAwayYards += playObj.yards;
                            }
                        } else {
                            defensiveYardsInfo.newAwayYards += playObj.yards;  
                            if(playObj.penalty == true && playObj.penaltyInfo.against == awayTeam) {
                                defensiveYardsInfo.newAwayYards = defensiveYardsInfo.newAwayYards - playObj.penaltyInfo.totalYards;
                            } else if(playObj.penalty == true && playObj.penaltyInfo.against == homeTeam) {
                                defensiveYardsInfo.newAwayYards += playObj.penaltyInfo.totalYards;
                            }   
                        }  
                                        
                    } else if(playObj.playType == 26 || playObj.playType == 36 || playObj.playType == 39 || (playObj.playType == 52 && score.def_pr_yd) || ((playObj.playType == 12 || playObj.playType == 32) && score.def_kr_yd) || ((playObj.playType == 17 || playObj.playType == 37) && score.blk_kick_ret_yd)) {
                        if(playObj.penalty == false || (playObj.penalty == true && playObj.penaltyInfo.against == awayTeam && playObj.yards > 0)) {
                            defensiveYardsInfo.newAwayYards = defensiveYardsInfo.newAwayYards - playObj.yards;
                        } else if(playObj.penalty == true && playObj.penaltyInfo.against == homeTeam) {
                            defensiveYardsInfo.newAwayYards += playObj.penaltyInfo.totalYards - playObj.yards;
                        } 
                    } else if(playObj.playType == 29) {
                        // statYardage counts yards before fumble
                        defensiveYardsInfo.newAwayYards += playObj.yards; 
                        // now debit the defense with recovery yards
                        let recoveryYards = 0;
                        if(playObj.secondDescription.includes('Yrd Fumble Recovery')) {
                            recoveryYards = playObj.secondDescription.slice(playObj.secondDescription.indexOf('Yrd Fumble Recovery') - 3, playObj.secondDescription.indexOf('Yrd Fumble Recovery'));
                            if(recoveryYards.slice(0, 1) == ' ') {
                                recoveryYards = parseInt(recoveryYards.slice(1, 2)); // TO-DO this doesn't always work, see buffalo game, texans dolphins week 9
                            } else {
                                recoveryYards = parseInt(recoveryYards.slice(0, 2));
                            }
                            defensiveYardsInfo.newAwayYards = defensiveYardsInfo.newAwayYards - recoveryYards;
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

                    if((playObj.playType == 5 || playObj.playType == 7 || playObj.playType == 9 || playObj.playType == 20 || playObj.playType == 24 || playObj.playType == 67 || playObj.playType == 68)) {
                        
                        if(playObj.playType == 5) {
                            if(playObj.penalty == true) {
                                defensiveYardsInfo.newHomeYards += playObj.penaltyInfo.trueYards;
                            } else {
                                defensiveYardsInfo.newHomeYards += playObj.yards;
                            }
                        } else {
                            defensiveYardsInfo.newHomeYards += playObj.yards;  
                            if(playObj.penalty == true && playObj.penaltyInfo.against == homeTeam) {
                                defensiveYardsInfo.newHomeYards = defensiveYardsInfo.newHomeYards - playObj.penaltyInfo.totalYards;
                            } else if(playObj.penalty == true && playObj.penaltyInfo.against == awayTeam) {
                                defensiveYardsInfo.newHomeYards += playObj.penaltyInfo.totalYards;
                            }   
                        }  
                        
                    } else if(playObj.playType == 26 || playObj.playType == 36 || playObj.playType == 39 || (playObj.playType == 52 && score.def_pr_yd) || ((playObj.playType == 12 || playObj.playType == 32) && score.def_kr_yd) || ((playObj.playType == 17 || playObj.playType == 37) && score.blk_kick_ret_yd)) {
                        if(playObj.penalty == false || (playObj.penalty == true && playObj.penaltyInfo.against == homeTeam && playObj.yards > 0)) {
                            defensiveYardsInfo.newHomeYards = defensiveYardsInfo.newHomeYards - playObj.yards;
                        } else if(playObj.penalty == true && playObj.penaltyInfo.against == awayTeam) {
                            defensiveYardsInfo.newHomeYards += playObj.penaltyInfo.totalYards - playObj.yards;
                        } 
                    } else if(playObj.playType == 29) {
                        // statYardage counts yards before fumble
                        defensiveYardsInfo.newHomeYards += playObj.yards; 
                        // now debit the defense with recovery yards
                        let recoveryYards = 0;
                        if(playObj.secondDescription.includes('Yrd Fumble Recovery')) {
                            recoveryYards = playObj.secondDescription.slice(playObj.secondDescription.indexOf('Yrd Fumble Recovery') - 3, playObj.secondDescription.indexOf('Yrd Fumble Recovery'));
                            if(recoveryYards.slice(0, 1) == ' ') {
                                recoveryYards = parseInt(recoveryYards.slice(1, 2));
                            } else {
                                recoveryYards = parseInt(recoveryYards.slice(0, 2));
                            }
                        }
                        defensiveYardsInfo.newHomeYards = defensiveYardsInfo.newHomeYards - recoveryYards;
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

        // calculates (single) reception bonuses
        const receptionBonus = (adjustedYards, statYDS, statRec, player) => {
            let receptionBonusInfo = {
                fpts: 0,
                stat: [],
                runningTotals: [],
            }
            if(0 < adjustedYards && adjustedYards < 5 && score.rec_0_4) {                                                                       // RECEPTION YD BONUS
                receptionBonusInfo.fpts = score.rec_0_4;
                receptionBonusInfo.stat.push('rec_0_4');
                const sleeperStat = 'rec_0_4';
                if(score.rec_0_4 != 0) {
                    let runningTotal = pushRunningTotal(score.rec_0_4, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                    receptionBonusInfo.runningTotals.push(runningTotal);
                }
            } else if(4 < adjustedYards && adjustedYards < 10 && score.rec_5_9) {
                receptionBonusInfo.fpts = score.rec_5_9;
                receptionBonusInfo.stat.push('rec_5_9');
                const sleeperStat = 'rec_5_9';
                if(score.rec_5_9 != 0) {
                    let runningTotal = pushRunningTotal(score.rec_5_9, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                    receptionBonusInfo.runningTotals.push(runningTotal);
                }
            } else if(9 < adjustedYards && adjustedYards < 20 && score.rec_10_19) {
                receptionBonusInfo.fpts = score.rec_10_19;
                receptionBonusInfo.stat.push('rec_10_19');
                const sleeperStat = 'rec_10_19';
                if(score.rec_10_19 != 0) {
                    let runningTotal = pushRunningTotal(score.rec_10_19, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                    receptionBonusInfo.runningTotals.push(runningTotal);
                }
            } else if(19 < adjustedYards && adjustedYards < 30 && score.rec_20_29) {
                receptionBonusInfo.fpts = score.rec_20_29;
                receptionBonusInfo.stat.push('rec_20_29');
                const sleeperStat = 'rec_20_29';
                if(score.rec_0_4 != 0) {
                    let runningTotal = pushRunningTotal(score.rec_20_29, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                    receptionBonusInfo.runningTotals.push(runningTotal);
                }
            } else if(29 < adjustedYards && adjustedYards < 40 && score.rec_30_39) {
                receptionBonusInfo.fpts = score.rec_30_39;
                receptionBonusInfo.stat.push('rec_30_39');
                const sleeperStat = 'rec_30_39';
                if(score.rec_0_4 != 0) {
                    let runningTotal = pushRunningTotal(score.rec_30_39, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                    receptionBonusInfo.runningTotals.push(runningTotal);
                }
            } else if(adjustedYards >= 40 && score.rec_40p) {
                receptionBonusInfo.fpts = score.rec_40p;
                receptionBonusInfo.stat.push('rec_40p');
                const sleeperStat = 'rec_40p';
                if(score.rec_0_4 != 0) {
                    let runningTotal = pushRunningTotal(score.rec_40p, statYDS, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                    receptionBonusInfo.runningTotals.push(runningTotal);
                }
            }
            if(player.playerInfo.pos == 'RB' && score.bonus_rec_rb) {                                                                               // RECEPTION POS BONUS
                receptionBonusInfo.fpts += score.bonus_rec_rb;
                receptionBonusInfo.stat.push('bonus_rec_rb');
                const sleeperStat = 'bonus_rec_rb';
                if(score.bonus_rec_rb != 0) {
                    let runningTotal = pushRunningTotal(score.bonus_rec_rb, statRec, sleeperStat, 0, player.playerInfo.playerID, player.playerInfo.pos); 
                    receptionBonusInfo.runningTotals.push(runningTotal);
                }
            } else if(player.playerInfo.pos == 'TE' && score.bonus_rec_te) {   
                receptionBonusInfo.fpts += score.bonus_rec_te;
                receptionBonusInfo.stat.push('bonus_rec_te');
                const sleeperStat = 'bonus_rec_te';
                if(score.bonus_rec_te != 0) {
                    let runningTotal = pushRunningTotal(score.bonus_rec_te, statRec, sleeperStat, 0, player.playerInfo.playerID, player.playerInfo.pos); 
                    receptionBonusInfo.runningTotals.push(runningTotal);
                }
            } else if(player.playerInfo.pos == 'WR' && score.bonus_rec_wr) {   
                receptionBonusInfo.fpts += score.bonus_rec_wr;
                receptionBonusInfo.stat.push('bonus_rec_wr');
                const sleeperStat = 'bonus_rec_wr';
                if(score.bonus_rec_wr != 0) {
                    let runningTotal = pushRunningTotal(score.bonus_rec_wr, statRec, sleeperStat, 0, player.playerInfo.playerID, player.playerInfo.pos); 
                    receptionBonusInfo.runningTotals.push(runningTotal);
                }
            }
            return receptionBonusInfo;
        }

        // tracks individual players' stat totals
        let runningTotals = {};
        const pushRunningTotal = (fpts, statDesc, stat, metric, playerID, position) => {
            if(!runningTotals[playerID]) {
                runningTotals[playerID] = {
                    stats: {},
                    totalFpts: 0,
                    filter: 'password',
                    pos: position,
                    yardsAllowedScored: new Boolean (false),
                    pointsAllowedScored: new Boolean (false),
                    bonus: [],
                }
            }
            if(statDesc == 'PTS ALW:' || statDesc == 'YDS ALW:') {
                if(statDesc == 'YDS ALW:' && runningTotals[playerID].yardsAllowedScored == false) {
                    runningTotals[playerID].totalFpts += fpts
                    runningTotals[playerID].stats[statDesc] = {
                        fpts: fpts,
                        occurs: 1,
                        metric: metric,
                        stat,
                        statDesc,
                    }
                    runningTotals[playerID].yardsAllowedScored = true;
                } else if(statDesc == 'PTS ALW:' && runningTotals[playerID].pointsAllowedScored == false) {
                    runningTotals[playerID].totalFpts += fpts
                    runningTotals[playerID].stats[statDesc] = {
                        fpts: fpts,
                        occurs: 1,
                        metric: metric,
                        stat,
                        statDesc,
                    }
                    runningTotals[playerID].pointsAllowedScored = true;
                }
            } else {
                runningTotals[playerID].totalFpts += fpts;

                if(!runningTotals[playerID].stats[statDesc]) {
                    runningTotals[playerID].stats[statDesc] = {
                        fpts: fpts,
                        occurs: 1,
                        metric: metric,
                        stat,
                        statDesc,
                    } 
                } else {
                    runningTotals[playerID].stats[statDesc].metric += metric;
                    runningTotals[playerID].stats[statDesc].fpts += fpts;
                    runningTotals[playerID].stats[statDesc].occurs ++;
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
        const processPlays = (playArray, defYardsArray, homeDefStarted, awayDefStarted, homeTeam, awayTeam, homeDefense, awayDefense, homeDefPtsAllowed, awayDefPtsAllowed, gameState, relevantStartersArray) => {
            let processedPlays = [];
            let fantasyPlay = {};
            for(const playKey in playArray) {
                const play = playArray[playKey];
                // create play-array to group fpts by multiple players in one play
                if(!fantasyPlay[play.playID]) {
                    fantasyPlay[play.playID] = [];
                }

                // INJURY PLAYS
                if(play.injuredStarter == true) {
                    const entry = {
                        order: play.order,
                        side: 'injury',
                        manager: play.injuryInfo[0].owner,
                        playerInfo: play.injuryInfo[0],
                        description: play.description,
                        shortDesc: 'Injury',
                    }
                    fantasyPlay[play.playID].push(entry);
                }
                // TO-DO: other non-defensive-score-hurting touchdowns                                      TEAM DEF POINTS ALLOWED
                if((play.scoreAgainstOppDEF == true || play.scoreAgainstDEF == true) && (homeDefStarted == true || awayDefStarted == true)) {
                    if(play.team == homeTeam) {
                        if(play.scoreAgainstDEF == true && awayDefStarted == true) {
                            let oldAwayDefPtsAllowed = awayDefPtsAllowed - play.scoreValueAgainstDEF;
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
                        } else if(play.scoreAgainstOppDEF == true && homeDefStarted == true) {
                            let oldHomeDefPtsAllowed = homeDefPtsAllowed - play.scoreValueAgainstOppDEF;
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
                    } else if(play.team == awayTeam) {
                        if(play.scoreAgainstDEF == true && homeDefStarted == true) {
                            let oldHomeDefPtsAllowed = homeDefPtsAllowed - play.scoreValueAgainstDEF;
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
                        } else if(play.scoreAgainstOppDEF == true && awayDefStarted == true) {
                            let oldAwayDefPtsAllowed = awayDefPtsAllowed - play.scoreValueAgainstOppDEF;
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
                        }
                    }
                }
                if(play.relevantDEF.length > 0) {                   // TEAM DEF/ST FPTS
                    let sackRecorded = new Boolean (false);
                    for(const relevantKey in play.relevantDEF) {
                        const player = play.relevantDEF[relevantKey];
                        let fumblerTeam;
                        if(player.statType == 'fumbler') {
                            fumblerTeam = player.playerInfo.t;
                        } else if(player.playType == 20) {                                                              // SAFETY - TEAM DEF
                            if(player.statType == 'sackedBy') {
                                const fpts = (score?.sack || 0) + player.yards * (score?.sack_yd || 0) + (score?.qb_hit || 0) + (score?.tkl || 0) + (score?.tkl_loss || 0);
                                const fptsSack = (score?.sack || 0);
                                const fptsSackYDS = player.yards * (score?.sack_yd || 0);           
                                const fptsQBHIT = (score?.qb_hit || 0);
                                const fptsTKL = (score?.tkl || 0);
                                const fptsLOSS = (score?.tkl_loss || 0);
                                const statSack = 'SACK:';
                                const statSackYDS = 'SACK YDS:';
                                const statQBHIT = 'QB HIT:';
                                const statTKL = 'TKL:'
                                const statLOSS = 'TKL LOSS:'
                                const entryDEF = {
                                    order: play.order,
                                    side: 'defense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['sack', 'sack_yd', 'qb_hit', 'tkl', 'tkl_loss'],
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
                                if(fptsLOSS != 0) {
                                    let runningTotal = pushRunningTotal(fptsLOSS, statLOSS, entryDEF.stat[4], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entryDEF.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entryDEF);
                                sackRecorded = true;       // so that split-sacks aren't counted twice
                            } else if(player.statType == 'scorer' && score.safe) {
                                const fpts = (score?.safe || 0);           
                                const statDesc = 'SAFETY:';
                                const entryDEF = {
                                    order: play.order,
                                    side: 'defense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['safe'],
                                    runningTotals: [],
                                    fpts,
                                    description: play.description,
                                    shortDesc: 'Safety',
                                }   
                                if(fpts != 0) {
                                    let runningTotal = pushRunningTotal(fpts, statDesc, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entryDEF.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entryDEF);
                            }
                        
                        } else if(player.statType == 'scorer' && player.playType == 39 && score.def_td) {                       // FUMBLE 6 - TEAM DEF
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
                                    } else if(score.fum_rec || score.fum_ret_yd) {                                                                    // FUMBLE RECOVERY PTS - TEAM DEF
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
                        } else if(player.statType == 'forcedBy' && (score.ff || score.def_st_ff)) {          // FORCED FUMBLE PTS - TEAM ST
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
                            } else if(score.ff) {                            // FORCED FUMBLE PTS - TEAM DEF
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
                            const fpts = (score?.sack || 0) + player.yards * (score?.sack_yd || 0) + (score?.qb_hit || 0) + (score?.tkl || 0) + (score?.tkl_loss || 0);
                            const fptsSack = (score?.sack || 0);
                            const fptsSackYDS = player.yards * (score?.sack_yd || 0);           
                            const fptsQBHIT = (score?.qb_hit || 0);
                            const fptsTKL = (score?.tkl || 0);
                            const fptsLOSS = (score?.tkl_loss || 0);
                            const statSack = 'SACK:';
                            const statSackYDS = 'SACK YDS:';
                            const statQBHIT = 'QB HIT:';
                            const statTKL = 'TKL:';
                            const statLOSS = 'TKL LOSS:';
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
                            if(fptsLOSS != 0) {
                                let runningTotal = pushRunningTotal(fptsLOSS, statLOSS, entryDEF.stat[4], 1, player.playerInfo.playerID, player.playerInfo.pos); 
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
                            if(player.playType == 12 && score.def_kr_yd) {
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
                            } else if(player.playType == 52 && (score.def_pr_yd || score.def_forced_punts)) {                  // PUNT - TEAM DEF/ST
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
                            } else if(player.playType == 32 && (score.def_kr_yd || score.def_st_td)) {                  // KICK 6 - TEAM DEF/ST
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
                            } else if(player.playType == 26 && (score.int || score.int_ret_yd)) {                      // INT TEAM DEF
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
                        } else if(score.blk_kick && play.pointAfterType == 43) {                                                    // BLOCKED PAT - TEAM DEF/ST
                            const fpts = (score?.blk_kick || 0);  
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
                                shortDesc: 'Blocked PAT',
                            }
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, stat, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryDEF.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entryDEF);
                        } else if(score.blk_kick && (player.playType == 18 || (player.playType == 60 && play.description.includes('BLOCKED'))) && player.statType == 'blocker') {                  // BLOCKED FIELD GOAL - TEAM DEF/ST
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
                        } else if((player.playType == 37 || player.playType == 17) && (player.statType == 'blocker' || player.statType == 'scorer') && (score.blk_kick || score.blk_kick_ret_yd || score.def_st_td)) {      
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
                            if(player.statType == 'blocker' && (score.blk_kick || score.blk_kick_ret_yd)) {
                                entryDEF.fpts += (score?.blk_kick || 0) + player.yards * (score?.blk_kick_ret_yd || 0);                                     // BLOCKED PUNT + RETURN - TEAM ST
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
                            } else if(player.statType == 'scorer' && score.def_st_td && play.scoringPlay == true) {                                                        // BLOCKED PUNT + TD - TEAM ST
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
                        } else if(player.playType == '4thdown') {                                                                                                   // TEAM DEF - 4TH DOWN STOP
                            const fpts = (score?.def_4_and_stop || 0);  
                            const stat = '4D STOP:';
                            const entryDEF = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['def_4_and_stop'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Forced Turnover on Downs',
                            }
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, stat, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entryDEF.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entryDEF);
                        } else if(player.playType == '3andout') {                                                                                           // TEAM DEF - 3 AND OUT
                            const fpts = (score?.def_3_and_out || 0);     
                            const stat = '3 & OUT:';
                            const entryDEF = {
                                order: play.order,
                                side: 'defense',
                                manager: player.manager,
                                playerInfo: player.playerInfo,
                                stat: ['def_3_and_out'],
                                runningTotals: [],
                                fpts,
                                description: play.description,
                                shortDesc: 'Forced Turnover on Downs',
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
                        const player = play.relevantPlayers[relevantKey];       
                        if(player.statType == 'fumbler' && (score.fum || score.fum_lost)) {                  // FUMBLE 
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
                            if(player.playType == 29 || player.playType == 39 || (player.playType != 9 && !play.description.includes(`recovered by ${player.playerTeam}`) && !play.description.includes(`and recovers`) && !play.description.includes(`ball out of bounds`))) {      // NEGATIVE POINTS for FUMBLE -> TURNOVER
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
                        } else if(score.idp_fum_rec && player.statType == 'recoverer' && player.playType != 9) {                            // FUMBLE RECOVERY IDP
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
                        } else if(score.idp_ff && player.statType == 'forcedBy' && player.playType == 9) {                              // FUMBLE FORCED PTS - IDP
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
                        if(play.pointAfterType == 15 && (score.rec_2pt || score.pass_2pt)) {                         // 2-PT CONVERSIONS
                            if(player.statType == 'patPasser' && score.pass_2pt) {                                                // 2-PT PASS
                                const fpts = (score?.pass_2pt || 0);
                                const stat2PT = '2PT PASS:';
                                const entry = {
                                    order: play.order,
                                    side: 'offense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['pass_2pt'],
                                    runningTotals: [],
                                    fpts,
                                    description: play.description,
                                    shortDesc: '2-PT Conversion (Pass)',
                                }
                                if(fpts != 0) {
                                    let runningTotal = pushRunningTotal(fpts, stat2PT, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entry);
                            } else if(player.statType == 'patScorer' && score.rec_2pt) {                             // 2-PT RECEPTION 
                                const fpts = (score?.rec_2pt || 0);
                                const stat2PT = '2PT REC:';
                                const entry = {
                                    order: play.order,
                                    side: 'offense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['rec_2pt'],
                                    runningTotals: [],
                                    fpts,
                                    description: play.description,
                                    shortDesc: '2-PT Conversion (Reception)',
                                }
                                if(fpts != 0) {
                                    let runningTotal = pushRunningTotal(fpts, stat2PT, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entry);
                            }
                        } else if(play.pointAfterType == 16 && score.rush_2pt) {
                            if(player.statType == 'patScorer' && score.rush_2pt) {                             // 2-PT RUSH
                                const fpts = (score?.rush_2pt || 0);
                                const stat2PT = '2PT RUSH:';
                                const entry = {
                                    order: play.order,
                                    side: 'offense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['rush_2pt'],
                                    runningTotals: [],
                                    fpts,
                                    description: play.description,
                                    shortDesc: '2-PT Conversion (Rush)',
                                }
                                if(fpts != 0) {
                                    let runningTotal = pushRunningTotal(fpts, stat2PT, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entry.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entry);
                            }
                        }
                        if((player.playType == 5 || player.playType == 9 || player.playType == 29 || player.playType == 39) && player.statType == 'rusher') {         // RUSH
                            let adjustedYards = player.yards;
                            if(play.penalty == true) {
                                // if(play.penaltyInfo.against == player.playerTeam) {
                                //     adjustedYards += play.penaltyInfo.totalYards;
                                // } else {
                                //     adjustedYards = adjustedYards - play.penaltyInfo.totalYards;
                                // }
                                adjustedYards = play.penaltyInfo.trueYards;
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
                            if(score.bonus_rush_att_20) {
                                const stat = 'CARRY BONUS(20+):';
                                const sleeperStat = 'bonus_rush_att_20';
                                let runningTotal = pushRunningTotal(0, stat, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                if(runningTotal.occurs == 20) {
                                    const fpts = score.bonus_rush_att_20;
                                    let runningTotal = pushRunningTotal(fpts, stat, sleeperStat, 0, player.playerInfo.playerID, player.playerInfo.pos); 
                                    let bonusEntry = entry;
                                    bonusEntry.shortDesc = 'Bonus: 20+ Carries';
                                    bonusEntry.stat = ['bonus_rush_att_20'];
                                    bonusEntry.runningTotals.push(runningTotal);
                                    fantasyPlay[play.playID].push(bonusEntry);
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
                            if(score.bonus_rush_att_20) {
                                const stat = 'CARRY BONUS(20+):';
                                const sleeperStat = 'bonus_rush_att_20';
                                let runningTotal = pushRunningTotal(0, stat, sleeperStat, 0, player.playerInfo.playerID, player.playerInfo.pos); 
                                if(runningTotal.occurs == 20) {
                                    const fpts = score.bonus_rush_att_20;
                                    let runningTotal = pushRunningTotal(fpts, stat, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    let bonusEntry = entry;
                                    bonusEntry.shortDesc = 'Bonus: 20+ Carries';
                                    bonusEntry.stat = ['bonus_rush_att_20'];
                                    bonusEntry.runningTotals.push(runningTotal);
                                    fantasyPlay[play.playID].push(bonusEntry);
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
                        } else if(player.playType == 36 && player.statType != 'patScorer') {            // PICK SIX 
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
                            } else if(player.statType == 'passer') {                       // P6 QB PENALTY
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
                                } else if(player.statType == 'receiver') {                              // RECEPTION
                                    const statRec = 'REC:';
                                    const statYDS = 'REC YDS:';
                                    let adjustedYards = player.yards;
                                    if(play.description.includes('Lateral')) {            // TO-DO fix this 
                                        let lateralInfo = processLateral(play, player, relevantStartersArray); 
                                        adjustedYards = lateralInfo.find(p => p.player == player).yards;
                                        // scoring the original receiver
                                        if(lateralInfo.find(p => p.player != player)) {                                          
                                            let firstPlayer = lateralInfo.find(p => p.player != player);
                                            let firstPlayerYards = firstPlayer.yards;
                                            const fpts = firstPlayerYards * (score?.rec_yd || 0) + (score?.rec || 0);
                                            const fptsREC = (score?.rec || 0);
                                            const fptsYDS = firstPlayerYards * (score?.rec_yd || 0);
                                            const entry = {
                                                order: play.order,
                                                side: 'offense',
                                                manager: firstPlayer.player.manager,
                                                playerInfo: firstPlayer.player.playerInfo,
                                                stat: ['rec_yd', 'rec'],
                                                runningTotals: [],
                                                fpts,
                                                yards: firstPlayerYards,
                                                description: play.description,
                                                shortDesc: 'Reception',
                                            }
                                            if(fptsRec != 0) {
                                                let runningTotal = pushRunningTotal(fptsREC, statRec, entry.stat[1], 1, firstPlayer.player.playerInfo.playerID, firstPlayer.player.playerInfo.pos); 
                                                entry.runningTotals.push(runningTotal);
                                            }
                                            if(fptsYDS != 0) {
                                                let runningTotal = pushRunningTotal(fptsYDS, statYDS, entry.stat[0], firstPlayerYards, firstPlayer.player.playerInfo.playerID, firstPlayer.player.playerInfo.pos); 
                                                entry.runningTotals.push(runningTotal);
                                            }
                                            if(firstPlayerYards > 0) {
                                                let receptionBonusInfo = receptionBonus(firstPlayerYards, statYDS, statRec, firstPlayer.player)
                                                if(receptionBonusInfo.stat.length > 0) {
                                                    for(const stat in receptionBonusInfo.stat) {
                                                        entry.stat.push(receptionBonusInfo.stat[stat]);
                                                    }
                                                }
                                                if(receptionBonusInfo.runningTotals.length > 0) {
                                                    for(const runTotal in receptionBonusInfo.runningTotals) {
                                                        entry.runningTotals.push(receptionBonusInfo.runningTotals[runTotal]);
                                                    }
                                                }
                                            }
                                            fantasyPlay[play.playID].push(entry);

                                            let lateralPlayers = lateralInfo.filter(p => p.player != player).shift();
                                            if(lateralPlayers.length > 0) {
                                                for(const lateralPlayer in lateralPlayers) {
                                                    const lateralee = lateralPlayers[lateralPlayer];
                                                    const lateraleeYards = lateralee.yards;
                                                    const fpts = lateraleeYards * (score?.rec_yd || 0);
                                                    const entry = {
                                                        order: play.order,
                                                        side: 'offense',
                                                        manager: lateralee.player.manager,
                                                        playerInfo: lateralee.player.playerInfo,
                                                        stat: ['rec_yd'],
                                                        runningTotals: [],
                                                        fpts,
                                                        yards: lateraleeYards,
                                                        description: play.description,
                                                        shortDesc: 'Pass Yards After Lateral',
                                                    }
                                                    if(fpts != 0) {
                                                        let runningTotal = pushRunningTotal(fpts, statYDS, entry.stat[0], lateraleeYards, lateralee.player.playerInfo.playerID, lateralee.player.playerInfo.pos); 
                                                        entry.runningTotals.push(runningTotal);
                                                    }
                                                }
                                            }

                                        }
                                    }
                                    if(play.penalty == true) {
                                        if(play.penaltyInfo.against == player.playerTeam) {
                                            adjustedYards += play.penaltyInfo.totalYards;
                                        } else {
                                            adjustedYards = adjustedYards - play.penaltyInfo.totalYards;
                                        }
                                    }
                                    let fpts = 0;
                                    let fptsRec = 0;
                                    let fptsYDS = 0;
                                    let entry;
                                    if(play.description.includes('Lateral')) {
                                        fpts = adjustedYards * (score?.rec_yd || 0);
                                        fptsYDS = fpts;
                                        entry = {
                                            order: play.order,
                                            side: 'offense',
                                            manager: player.manager,
                                            playerInfo: player.playerInfo,
                                            stat: ['rec_yd'],
                                            runningTotals: [],
                                            fpts,
                                            yards: adjustedYards,
                                            description: play.description,
                                            shortDesc: 'Pass Yards After Lateral',
                                        }
                                    } else {
                                        fpts = adjustedYards * (score?.rec_yd || 0) + (score?.rec || 0);
                                        fptsRec = (score?.rec || 0);
                                        fptsYDS = adjustedYards * (score?.rec_yd || 0);
                                        entry = {
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
                                    }

                                    if(fptsRec != 0) {
                                        let runningTotal = pushRunningTotal(fptsRec, statRec, entry.stat[1], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entry.runningTotals.push(runningTotal);
                                    }
                                    if(fptsYDS != 0) {
                                        let runningTotal = pushRunningTotal(fptsYDS, statYDS, entry.stat[0], adjustedYards, player.playerInfo.playerID, player.playerInfo.pos); 
                                        entry.runningTotals.push(runningTotal);
                                    }
                                    if(!play.description.includes('Lateral')) {
                                        let receptionBonusInfo = receptionBonus(adjustedYards, statYDS, statRec, player);
                                        entry.fpts += (receptionBonusInfo?.fpts || 0);
                                        if(receptionBonusInfo.stat.length > 0) {
                                            for(const stat in receptionBonusInfo.stat) {
                                                entry.stat.push(receptionBonusInfo.stat[stat]);
                                            }
                                        }
                                        if(receptionBonusInfo.runningTotals.length > 0) {
                                            for(const runTotal in receptionBonusInfo.runningTotals) {
                                                entry.runningTotals.push(receptionBonusInfo.runningTotals[runTotal]);
                                            }
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
                        } else if(player.playType == 3 && player.statType == 'passer' && (score.pass_inc || score.pass_att)) {         // INCOMPLETE PASS
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
                        } else if(player.playType == 7 && (score.pass_sack || score.idp_sack || score.idp_sack_yd || score.idp_qb_hit || score.idp_tkl || score.idp_tkl_loss || score.idp_tkl_ast || score.idp_tkl_solo)) {
                            if(player.statType == 'passer' && score.pass_sack) {                                        // SACK - QB
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
                            } else if(player.statType == 'sackedBy' && (score.idp_sack || score.idp_sack_yd || score.idp_qb_hit || score.idp_tkl || score.idp_tkl_loss || score.idp_tkl_ast || score.idp_tkl_solo || score.bonus_sack_2p)) {                                                     
                                const fpts = (score?.idp_sack || 0) + player.yards * (score?.idp_sack_yd || 0) + (score?.idp_qb_hit || 0) + (score?.idp_tkl || 0) + (score?.idp_tkl_loss);
                                const fptsSack = (score?.idp_sack || 0);
                                const fptsSackYDS = player.yards * (score?.idp_sack_yd || 0);                                                   // SACK - IDP - TO-DO: account for assisted tackles/sacks IDP
                                const fptsQBHIT = (score?.idp_qb_hit || 0);
                                const fptsTKL = (score?.idp_tkl || 0);
                                const fptsLOSS = (score?.idp_tkl_loss || 0);
                                const statSack = 'SACK:';
                                const statSackYDS = 'SACK YDS:';
                                const statQBHIT = 'QB HIT:';
                                const statTKL = 'TKL:'
                                const statLOSS = 'TKL LOSS:'
                                const entryDEF = {
                                    order: play.order,
                                    side: 'defense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['idp_sack', 'idp_sack_yd', 'idp_qb_hit', 'idp_tkl', 'idp_tkl_loss'],
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
                                if(fptsLOSS != 0) {
                                    let runningTotal = pushRunningTotal(fptsLOSS, statLOSS, entryDEF.stat[4], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entryDEF.runningTotals.push(runningTotal);
                                }
                                if(score.bonus_sack_2p) {
                                    const stat = 'SACK BONUS(2+):';
                                    const sleeperStat = 'bonus_sack_2p';
                                    let runningTotal = pushRunningTotal(0, stat, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    if(runningTotal.occurs == 2) {
                                        const fpts = score.bonus_sack_2p;
                                        let runningTotal = pushRunningTotal(fpts, stat, sleeperStat, 0, player.playerInfo.playerID, player.playerInfo.pos); 
                                        let bonusEntry = entry;
                                        bonusEntry.shortDesc = 'Bonus: 2+ Sacks';
                                        bonusEntry.stat = ['bonus_sack_2p'];
                                        bonusEntry.runningTotals.push(runningTotal);
                                        fantasyPlay[play.playID].push(bonusEntry);
                                    }
                                }
                                fantasyPlay[play.playID].push(entryDEF);
                            }
                        } else if(player.playType == 59 && player.statType == 'kicker') {                                   // MADE FIELD GOAL
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
                        } else if((player.playType == 60 || player.playType == 18) && player.statType == 'kicker') {           // MISSED FIELD GOAL
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
                            fantasyPlay[play.playID].push(entry);                                                          
                        } else if(player.statType == 'patScorer' && play.scoringType == 'touchdown' && score.xpmiss && (play.pointAfterType == 62 || play.pointAfterType == 43)) {                 // PAT MISS
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
                                shortDesc: play.pointAfterType == 62 ? 'PAT Missed' : 'PAT Blocked',
                            }   
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, stat, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entry);                                                                                    
                        } else if(player.statType == 'patScorer' && play.scoringType == 'touchdown' && score.xpm && play.pointAfterType == 61) {                    // PAT GOOD
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
                        } else if(player.statType == 'returner' && player.playType == 12 && score.kr_yd) {                                  // ST PLAYER - KICK RETURN YDS
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
                        } else if(score.idp_blk_kick && player.statType == 'blocker' && (player.playType == 17 || player.playType == 37 || player.playType == 18 || (player.playType == 60 && play.description.includes('BLOCKED')))) {               // IDP - BLOCK KICK
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
                                shortDesc: 'Blocked Punt',
                            }
                            if(player.playType == 18 || (player.playType == 60 && play.description.includes('BLOCKED'))) {
                                entry.shortDesc = 'Blocked Field Goal';
                            }
                            if(fpts != 0) {
                                let runningTotal = pushRunningTotal(fpts, stat, entry.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                entry.runningTotals.push(runningTotal);
                            }
                            fantasyPlay[play.playID].push(entry);
                        } else if(score.idp_def_td && player.statType == 'scorer' && (player.playType == 17 || player.playType == 37 || player.playType == 29 || player.playType == 39)) {               // IDP - TD (other than pick 6)
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
                        } else if(player.playType == 20 && (score.idp_safe || score.idp_sack || score.idp_sack_yd || score.idp_qb_hit || score.idp_tkl || score.idp_tkl_loss || score.idp_tkl_ast || score.idp_tkl_solo || score.bonus_sack_2p)) {
                            if(player.statType == 'sackedBy' && (score.idp_sack || score.idp_sack_yd || score.idp_qb_hit || score.idp_tkl || score.idp_tkl_loss || score.idp_tkl_ast || score.idp_tkl_solo || score.bonus_sack_2p)) {                                                     
                                const fpts = (score?.idp_sack || 0) + player.yards * (score?.idp_sack_yd || 0) + (score?.idp_qb_hit || 0) + (score?.idp_tkl || 0) + (score?.idp_tkl_loss);
                                const fptsSack = (score?.idp_sack || 0);
                                const fptsSackYDS = player.yards * (score?.idp_sack_yd || 0);                                                   // SAFETY - IDP - TO-DO: account for assisted tackles/sacks IDP
                                const fptsQBHIT = (score?.idp_qb_hit || 0);
                                const fptsTKL = (score?.idp_tkl || 0);
                                const fptsLOSS = (score?.idp_tkl_loss || 0);
                                const statSack = 'SACK:';
                                const statSackYDS = 'SACK YDS:';
                                const statQBHIT = 'QB HIT:';
                                const statTKL = 'TKL:'
                                const statLOSS = 'TKL LOSS:'
                                const entryDEF = {
                                    order: play.order,
                                    side: 'defense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['idp_sack', 'idp_sack_yd', 'idp_qb_hit', 'idp_tkl', 'idp_tkl_loss'],
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
                                if(fptsLOSS != 0) {
                                    let runningTotal = pushRunningTotal(fptsLOSS, statLOSS, entryDEF.stat[4], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entryDEF.runningTotals.push(runningTotal);
                                }
                                if(score.bonus_sack_2p) {
                                    const stat = 'SACK BONUS(2+):';
                                    const sleeperStat = 'bonus_sack_2p';
                                    let runningTotal = pushRunningTotal(0, stat, sleeperStat, 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    if(runningTotal.occurs == 2) {
                                        const fpts = score.bonus_sack_2p;
                                        let runningTotal = pushRunningTotal(fpts, stat, sleeperStat, 0, player.playerInfo.playerID, player.playerInfo.pos); 
                                        let bonusEntry = entry;
                                        bonusEntry.shortDesc = 'Bonus: 2+ Sacks';
                                        bonusEntry.stat = ['bonus_sack_2p'];
                                        bonusEntry.runningTotals.push(runningTotal);
                                        fantasyPlay[play.playID].push(bonusEntry);
                                    }
                                }
                                fantasyPlay[play.playID].push(entryDEF);
                            } else if(player.statType == 'scorer' && score.idp_safe) {
                                const fpts = (score?.idp_safe || 0);           
                                const statDesc = 'SAFETY:';
                                const entryDEF = {
                                    order: play.order,
                                    side: 'defense',
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['safe'],
                                    runningTotals: [],
                                    fpts,
                                    description: play.description,
                                    shortDesc: 'Safety',
                                }   
                                if(fpts != 0) {
                                    let runningTotal = pushRunningTotal(fpts, statDesc, entryDEF.stat[0], 1, player.playerInfo.playerID, player.playerInfo.pos); 
                                    entryDEF.runningTotals.push(runningTotal);
                                }
                                fantasyPlay[play.playID].push(entryDEF);
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
                startersArray: [],
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
                            owner: match[opponent].manager,
                            recordManID: match[opponent].recordManID,
                            fn: starterInfo.fn,
                            ln: starterInfo.ln,
                            pos: starterInfo.pos,
                            t: starterInfo.t,
                            avatar: starterInfo.pos == "DEF" ? `https://sleepercdn.com/images/team_logos/nfl/${starter.toLowerCase()}.png` : `https://sleepercdn.com/content/nfl/players/thumb/${starter}.jpg`,
                            teamAvatar: `https://sleepercdn.com/images/team_logos/nfl/${starterInfo.t?.toLowerCase()}.png` || `https://sleepercdn.com/content/nfl/players/thumb/${starter}.jpg`,
                            teamColor: `background-color: #${nflTeams[starterInfo.t]?.color}6b` || `background-color: var(--boxShadowThree)`,
                            teamAltColor: `background-color: #${nflTeams[starterInfo.t]?.alternateColor}52` || `background-color: var(--boxShadowThree)`,
                        }
                        if(starterInfo.t && nflTeams[starterInfo.t].color == nflTeams[starterInfo.t].alternateColor && nflTeams[starterInfo.t].color == '000000') {
                            starterEntry.teamAltColor = `background-color: #ffffff52`;
                        }

                        relevancyKey.starters[match[opponent].recordManID].push(starterEntry);
                        relevancyKey.startersArray.push(starterEntry);

                        // get starters' game IDs
                        if(nflMatchups.find(m => m.some(m => m.sleeperID == starterInfo.t))) {
                            let nflGameID = nflMatchups.find(m => m.some(m => m.sleeperID == starterInfo.t))[0].gameID;
                            if(!relevancyKey.games.includes(nflGameID)) {
                                relevancyKey.games.push(nflGameID);
                            }
                        }
                    }
                }
            }
            // process every relevant game's play by play for plays relevant to matchup
            for(const gameSelect in relevancyKey.games) {
                let playByPlayData = await getPlayByPlay(relevancyKey.games[gameSelect], true).catch((err) => { console.error(err); });
                let fantasyRelevantPlaysForward = [];
                let defYdsThreshBreakers = [];

                // identify NFL teams in the current game
                let game = nflMatchups.find(m => m[0].gameID == relevancyKey.games[gameSelect]);
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
                const score = yearLeagueData.scoring_settings;

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

                if(playByPlayData && playByPlayData.length) {
                    // set key to number of API pages for the full PBP
                    let recencyKey = playByPlayData.length;                
                    // start with first page
                    for(let j = 0; j < recencyKey; j++) {
                        let playsData = playByPlayData[j].items;
                        // start with first play on page
                        for(let k = 0; k < playsData.length; k++) {
                            let play = playsData[k];
                            // find which team made the play (checking team of first play participant is most reliably correct way)
                            let espnTeamID;
                            let linkType;
                            if(play.participants && play.participants[0].athlete) {
                                linkType = 'participants';
                                espnTeamID = await parseEspnTeamID(play.participants[0].athlete.$ref, linkType);
                            } else {
                                linkType = 'play';
                                espnTeamID = await parseEspnTeamID(play.team.$ref, linkType);
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
                            let playType = play.type?.id || 0;
                            let noPlay = checkNoPlay(playType, play.alternativeText);
                            // flagging scoring plays & tracking DEF points allowed
                            let scoringPlay = new Boolean (false);
                            let scoreAgainstDEF = new Boolean (false);
                            let scoreAgainstOppDEF = new Boolean (false);
                            let scoreValueAgainstDEF = 0;
                            let scoreValueAgainstOppDEF = 0;
                            let scoringType = null;
                            let pointAfterType = null;
                            let scoreValue = 0;
                            if(play.scoreValue > 0) {
                                scoringPlay = true;
                                scoringType = play.scoringType.name;
                                scoringType = play.scoringType.name;
                                if(scoringType == 'touchdown') {
                                    if(play.pointAfterAttempt) {
                                        pointAfterType = play.pointAfterAttempt.id;
                                        if((pointAfterType == 15 || pointAfterType == 16) && play.pointAfterAttempt.value == 0) {
                                            pointAfterType = -1        // MY id for failed 2-pt conversion
                                        }
                                    } else {
                                        if(play.alternativeText.includes('Kick)')) {
                                            pointAfterType = 61;
                                        } else if(play.alternativeText.includes('PAT failed')) {
                                            pointAfterType = 62;
                                        } else if(play.alternativeText.includes('PAT blocked')) {
                                            pointAfterType = 43;
                                        } else if(play.alternativeText.includes('TWO-POINT') && play.alternativeText.includes('SUCCEEDS')) {
                                            let twoPointText = play.alternativeText.slice(play.alternativeText.indexOf('TWO-POINT'));
                                            if(twoPointText.includes('rush')) {
                                                pointAfterType = 16;
                                            } else {
                                                pointAfterType = 15;
                                            }
                                        } else if(play.alternativeText.includes('Conversion Failed')) {
                                            pointAfterType = -1;
                                        }
                                    }
                                }
                                if(play.scoreValue == 6 && pointAfterType == 61) {
                                    scoreValue = 7;
                                } else if(play.scoreValue == 6 && (pointAfterType == 15 || pointAfterType == 16)) {
                                    scoreValue = 8;
                                } else {
                                    scoreValue = play.scoreValue;
                                }
                                if(playType == 17 || playType == 37 || playType == 32) {        // TO-DO add field goal kick 6 & 2pt return score
                                    scoreAgainstDEF = false;
                                    scoreAgainstOppDEF = true;
                                    if(playTeam == homeEspn) {
                                        homeDefPtsAllowed += scoreValue;
                                    } else {
                                        awayDefPtsAllowed += scoreValue;
                                    }
                                    scoreValueAgainstOppDEF = scoreValue;
                                } else if(playType == 36 || playType == 39 || playType == 29 || playType == 20) {     // pick 6 / fumble 6
                                    if(scoreValue == 6 || scoreValue == 2) {
                                        scoreAgainstDEF = false;
                                        scoreAgainstOppDEF = false;
                                    } else if(scoreValue > 6) {
                                        scoreAgainstDEF = true;
                                        scoreAgainstOppDEF = false;
                                        if(playTeam == homeEspn) {
                                            awayDefPtsAllowed += scoreValue - 6;
                                        } else {
                                            homeDefPtsAllowed += scoreValue - 6;
                                        }
                                        scoreValueAgainstDEF = scoreValue - 6;
                                    }
                                } else {
                                    scoreAgainstDEF = true;
                                    scoreAgainstOppDEF = false;
                                    if(playTeam == homeEspn) {
                                        awayDefPtsAllowed += scoreValue;
                                    } else {
                                        homeDefPtsAllowed += scoreValue;
                                    }
                                    scoreValueAgainstDEF = scoreValue;
                                }
                            }
                            // the play object with all necessary info
                            const playEntry = {
                                playID: play.id,
                                order: parseInt(play.sequenceNumber),
                                playType: playType,
                                team: playTeam,
                                oppTeam,
                                description: play.alternativeText,
                                secondDescription: play.shortAlternativeText,
                                scoringPlay,
                                scoringType,
                                pointAfterType,
                                scoreValue,
                                scoreValueAgainstDEF,
                                scoreValueAgainstOppDEF,
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
                                injuredStarter: new Boolean (false),
                                injuryInfo: [],
                            }
                            // flagging injuries
                            if(play.alternativeText.includes('injured')) {
                                let injuredPlayer = checkInjury(play.alternativeText, relevancyKey.startersArray);
                                if(injuredPlayer != null) {
                                    playEntry.injuredStarter = true;
                                    playEntry.injuryInfo.push(injuredPlayer);
                                }
                            }
                            // get penalty info
                            if(noPlay == false && play.alternativeText.includes('PENALTY') && play.alternativeText.includes('enforced')) {
                                let truePenaltyInfo = getTruePenalty(playTeam, oppTeam, play.alternativeText, play.shortAlternativeText, playType, play.statYardage);
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

                            // flagging plays relevant to starters
                            if(noPlay == false && play.participants) {
                                // loop thru every player involved in play
                                for(const playerKey in play.participants) {
                                    // which team is player on
                                    const linkType = 'info';
                                    let espnPlayerInfo = await parseEspnTeamID(play.participants[playerKey].athlete.$ref, linkType);
                                    let playerTeam;
                                    let playerTeam_sleeper;
                                    for(const key in nflTeams) {
                                        if(nflTeams[key].espnID == espnPlayerInfo.t) {
                                            playerTeam = nflTeams[key].espnAbbreviation;
                                            playerTeam_sleeper = key;
                                            break;
                                        }
                                    }
                                    // Catching exceptions with different names
                                    if(espnPlayerInfo.fn == 'William' && espnPlayerInfo.ln == 'Fuller V') {
                                        espnPlayerInfo.fn == 'Will';
                                        espnPlayerInfo.ln == 'Fuller';
                                    } else if(espnPlayerInfo.fn == 'Jeff' && espnPlayerInfo.ln == 'Wilson Jr.') {
                                        espnPlayerInfo.fn = 'Jeffery';
                                        espnPlayerInfo.ln = 'Wilson';
                                    }
                                    if(espnPlayerInfo.ln.includes('Jr.') || espnPlayerInfo.ln.includes('Sr.') || espnPlayerInfo.ln.includes('III')) {
                                        espnPlayerInfo.ln = espnPlayerInfo.ln.slice(0, espnPlayerInfo.ln.length - 4);
                                    } else if(espnPlayerInfo.ln.includes('II')) {
                                        espnPlayerInfo.ln = espnPlayerInfo.ln.slice(0, espnPlayerInfo.ln.length - 3);
                                    } else if(espnPlayerInfo.ln.slice(espnPlayerInfo.ln.length - 2) == ' V') {
                                        espnPlayerInfo.ln = espnPlayerInfo.ln.slice(0, espnPlayerInfo.ln.length - 2);
                                    }
                                    if(espnPlayerInfo.pos == 'PK') {
                                        espnPlayerInfo.pos = 'K';
                                    }
                                    if(espnPlayerInfo.pos == 'FB') {
                                        espnPlayerInfo.pos = 'RB';
                                    }
                                    let sleeperMatch = null;
                                    for(const recordManID in relevancyKey.starters) {
                                        if(relevancyKey.starters[recordManID].filter(s => s.fn == espnPlayerInfo.fn && s.ln == espnPlayerInfo.ln && s.pos == espnPlayerInfo.pos).length > 0) {
                                            sleeperMatch = relevancyKey.starters[recordManID].filter(s => s.fn == espnPlayerInfo.fn && s.ln == espnPlayerInfo.ln && s.pos == espnPlayerInfo.pos);
                                            break;
                                        }
                                    }
                                    // if the current player involved in the play is a starter, we combine the sleeper and espn info for their entry in the playEntry
                                    if(sleeperMatch != null) {
                                        // assigning correct team if player has retired (& thus Sleeper team info is blank) OR player was with different team than he is currently
                                        if(sleeperMatch[0].t == null || sleeperMatch[0].t != playerTeam_sleeper) {
                                            sleeperMatch[0].t = playerTeam_sleeper;
                                            playersInfo.players[sleeperMatch[0].playerID].t = playerTeam_sleeper;
                                        }
                                        const relevantEntry = {
                                            playerInfo: sleeperMatch[0],
                                            manager: sleeperMatch[0].owner,
                                            statType: play.participants[playerKey].type,
                                            yards: play.statYardage, 
                                            playType: playType,
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
                                    if(noPlay == false && (homeDefStarted == true || awayDefStarted == true)) {
                                        let relevantDefEntry = isDefRelevant(play, playType, playTeam, homeDefStarted, awayDefStarted, homeEspn, awayEspn, homeDefense, awayDefense, playerKey, playerTeam);
                                        if(relevantDefEntry != null) {
                                            playEntry.relevantDEF.push(relevantDefEntry);
                                        }
                                    }
                                }
                                // only push on plays involving starters, and not called back for penalty (deal with those separately)
                                if(noPlay == false && (playEntry.relevantPlayers.length > 0 || playEntry.relevantDEF.length >  0 || playEntry.scoringPlay == true || playEntry.injuredStarter == true)) {
                                    fantasyRelevantPlaysForward.push(playEntry);
                                } 
                            }
                        }
                    }
                    
                    if(homeDefStarted == true) {
                        let fantasyYardsInfo = calculateDefYardsAllowed(homeDefYdsAllowed);
                        const statDesc = 'YDS ALW:';
                        let runningTotal = pushRunningTotal(fantasyYardsInfo.DEFscore, statDesc, fantasyYardsInfo.DEFthreshold, homeDefYdsAllowed, homeDefense.playerID, homeDefense.pos);
                        let fantasyPointsInfo = calculateDefPointsAllowed(homeDefPtsAllowed);
                        const statDescPTS = 'PTS ALW:';
                        let runningTotalPTS = pushRunningTotal(fantasyPointsInfo.DEFscore, statDescPTS, fantasyPointsInfo.DEFthreshold, homeDefPtsAllowed, homeDefense.playerID, homeDefense.pos);
                    }
                    if(awayDefStarted == true) {
                        let fantasyYardsInfo = calculateDefYardsAllowed(awayDefYdsAllowed);
                        const statDesc = 'YDS ALW:';
                        let runningTotal = pushRunningTotal(fantasyYardsInfo.DEFscore, statDesc, fantasyYardsInfo.DEFthreshold, awayDefYdsAllowed, awayDefense.playerID, awayDefense.pos);
                        let fantasyPointsInfo = calculateDefPointsAllowed(awayDefPtsAllowed);
                        const statDescPTS = 'PTS ALW:';
                        let runningTotalPTS = pushRunningTotal(fantasyPointsInfo.DEFscore, statDescPTS, fantasyPointsInfo.DEFthreshold, awayDefPtsAllowed, awayDefense.playerID, awayDefense.pos);
                    }

                    // IF DEF is started && IF stats count, loop thru drives API to flag 4th down stops, 3 & outs, etc
                    if((gameState == 'in' || gameState == 'post') && (homeDefStarted == true || awayDefStarted == true) && (score.def_3_and_out || score.def_4_and_stop)) { 
                        let drivesData = await getGameDrives(relevancyKey.games[gameSelect], true).catch((err) => { console.error(err); });
                        let drivesKey = drivesData.length;

                        for(let d = 0; d < drivesKey; d++) {
                            let driveData = drivesData[d].items;

                            for(let e = 0; e < driveData.length; e++) {
                                let drive = driveData[e];
                                
                                if(score.def_3_and_out && drive.offensivePlays == 3 && drive.result == 'PUNT') {
                                    let lastPlay = drive.plays.items[drive.plays.items.length - 1];
                                    if(!lastPlay.participants) {
                                        lastPlay = drive.plays.items[drive.plays.items.length - 2];
                                    }
                                    let linkType = 'participants';
                                    let espnTeamID = await parseEspnTeamID(lastPlay.participants[0].athlete.$ref, linkType);

                                    let playTeam;
                                    let oppTeam;
                                    let defense;

                                    for(const key in nflTeams) {
                                        if(nflTeams[key].espnID == espnTeamID) {
                                            playTeam = nflTeams[key].espnAbbreviation;
                                            break;
                                        }
                                    }
                                    if((playTeam == homeEspn && awayDefStarted == false) || (playTeam == awayEspn && homeDefStarted == false)) {
                                        continue;
                                    } else {
                                        if(playTeam == homeEspn) {
                                            oppTeam = awayEspn;
                                            defense = awayDefense;
                                        } else {
                                            oppTeam = homeEspn;
                                            defense = homeDefense;
                                        }
                                    }
                                    // the play object with all necessary info
                                    const playEntry = {
                                        playID: lastPlay.id,
                                        order: parseInt(lastPlay.sequenceNumber),
                                        playType: '3andout',
                                        team: playTeam,
                                        oppTeam,
                                        description: lastPlay.alternativeText,
                                        secondDescription: lastPlay.shortAlternativeText,
                                        scoringPlay: false,
                                        scoringType: null,
                                        pointAfterType: null,
                                        scoreValue: 0,
                                        scoreValueAgainstDEF: 0,
                                        scoreValueAgainstOppDEF: 0,
                                        yards: lastPlay.statYardage,
                                        relevantPlayers: [],
                                        relevantDEF: [],
                                        scoreAgainstDEF: false,
                                        scoreAgainstOppDEF: false,
                                        teamStartPoss: lastPlay?.start.team?.$ref || null,
                                        teamEndPoss: lastPlay?.end.team?.$ref || null,
                                        noPlay: false,
                                        penalty: new Boolean (false),
                                        penaltyInfo: null,
                                        injuredStarter: new Boolean (false),
                                        injuryInfo: [],
                                    }

                                    const relevantEntry = {
                                        playerInfo: defense,
                                        manager: defense.owner,
                                        statType: lastPlay.participants[0].type,
                                        yards: lastPlay.statYardage, 
                                        playType: '3andout',
                                        oppDef: playTeam,
                                    }
                                    playEntry.relevantDEF.push(relevantEntry);
                                    fantasyRelevantPlaysForward.push(playEntry);
                                } else if(score.def_4_and_stop && drive.result == 'DOWNS') {
                                    let lastPlay = drive.plays.items[drive.plays.items.length - 1];
                                    if(!lastPlay.participants) {
                                        lastPlay = drive.plays.items[drive.plays.items.length - 2];
                                    }
                                    let linkType = 'participants';
                                    let espnTeamID = await parseEspnTeamID(lastPlay.participants[0].athlete.$ref, linkType);
                                    let playTeam;
                                    let oppTeam;
                                    let defense;

                                    for(const key in nflTeams) {
                                        if(nflTeams[key].espnID == espnTeamID) {
                                            playTeam = nflTeams[key].espnAbbreviation;
                                            break;
                                        }
                                    }
                                    if((playTeam == homeEspn && awayDefStarted == false) || (playTeam == awayEspn && homeDefStarted == false)) {
                                        continue;
                                    } else {
                                        if(playTeam == homeEspn) {
                                            oppTeam = awayEspn;
                                            defense = awayDefense;
                                        } else {
                                            oppTeam = homeEspn;
                                            defense = homeDefense;
                                        }
                                    }
                                    // the play object with all necessary info
                                    const playEntry = {
                                        playID: lastPlay.id,
                                        order: parseInt(lastPlay.sequenceNumber),
                                        playType: '4thdown',
                                        team: playTeam,
                                        oppTeam,
                                        description: lastPlay.alternativeText,
                                        scoringPlay: false,
                                        scoringType: null,
                                        pointAfterType: null,
                                        scoreValue: 0,
                                        scoreValueAgainstDEF: 0,
                                        scoreValueAgainstOppDEF: 0,
                                        yards: lastPlay.statYardage,
                                        relevantPlayers: [],
                                        relevantDEF: [],
                                        scoreAgainstDEF: false,
                                        scoreAgainstOppDEF: false,
                                        teamStartPoss: lastPlay?.start.team?.$ref || null,
                                        teamEndPoss: lastPlay?.end.team?.$ref || null,
                                        noPlay: false,
                                        penalty: new Boolean (false),
                                        penaltyInfo: null,
                                        injuredStarter: new Boolean (false),
                                        injuryInfo: [],
                                    }

                                    const relevantEntry = {
                                        playerInfo: defense,
                                        manager: defense.owner,
                                        statType: lastPlay.participants[0].type,
                                        yards: lastPlay.statYardage, 
                                        playType: '4thdown',
                                        oppDef: playTeam,
                                    }
                                    playEntry.relevantDEF.push(relevantEntry);
                                    fantasyRelevantPlaysForward.push(playEntry);
                                }
                            }
                        }
                    }

                    let fantasyRelevantPlays = fantasyRelevantPlaysForward.slice().reverse();
                    let fantasyProducts_matchGame = processPlays(fantasyRelevantPlays, defYdsThreshBreakers, homeDefStarted, awayDefStarted, homeEspn, awayEspn, homeDefense, awayDefense, homeDefPtsAllowed, awayDefPtsAllowed, gameState, relevancyKey.startersArray);

                    for(const product of fantasyProducts_matchGame) {
                        fantasyProducts_match.push(product);
                    }
                }
            
                fantasyProducts = fantasyProducts_match;
                fantasyProducts = fantasyProducts.filter(p => p.length > 0);
                fantasyProducts = fantasyProducts.sort((a, b) => b[0]?.order - a[0]?.order);
            }
            // nfl game play by play
        } else if(showGameBox == true) {

            runningTotals = {};

            let playByPlayData = await getPlayByPlay(gameSelection, true).catch((err) => { console.error(err); });
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
            let game = nflMatchups.find(m => m[0].gameID == gameSelection);
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
            if(playByPlayData && playByPlayData.length) {
                // set key to number of API pages for the full PBP
                let recencyKey = playByPlayData.length;
                // start with first page
                for(let j = 0; j < recencyKey; j++) {
                    let playsData = playByPlayData[j].items;
                    // start with first play on page
                    for(let k = 0; k < playsData.length; k++) {
                        let play = playsData[k];
                        // which team made the play
                        let espnTeamID;
                        let linkType;
                        if(play.participants && play.participants[0].athlete) {
                            linkType = 'participants';
                            espnTeamID = await parseEspnTeamID(play.participants[0].athlete.$ref, linkType);
                        } else {
                            linkType = 'play';
                            espnTeamID = await parseEspnTeamID(play.team.$ref, linkType);
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
                        let playType = play.type?.id || 0;
                        let noPlay = checkNoPlay(playType, play.alternativeText);
                        // flagging scoring plays & tracking DEF points allowed
                        let scoringPlay = new Boolean (false);
                        let scoreAgainstDEF = new Boolean (false);
                        let scoreAgainstOppDEF = new Boolean (false);
                        let scoreValueAgainstDEF = 0;
                        let scoreValueAgainstOppDEF = 0;
                        let scoringType = null;
                        let pointAfterType = null;
                        let scoreValue = 0;
                        if(play.scoreValue > 0) {
                            scoringPlay = true;
                            scoringType = play.scoringType.name;
                            if(scoringType == 'touchdown') {
                                if(play.pointAfterAttempt) {
                                    pointAfterType = play.pointAfterAttempt.id;
                                    if((pointAfterType == 15 || pointAfterType == 16) && play.pointAfterAttempt.value == 0) {
                                        pointAfterType = -1        // MY id for failed 2-pt conversion
                                    }
                                } else {
                                    if(play.alternativeText.includes('Kick)') || play.shortAlternativeText.includes('Kick)')) {
                                        pointAfterType = 61;
                                    } else if(play.alternativeText.includes('PAT failed')) {
                                        pointAfterType = 62;
                                    } else if(play.alternativeText.includes('PAT blocked')) {
                                        pointAfterType = 43;
                                    } else if(play.alternativeText.includes('TWO-POINT') && play.alternativeText.includes('SUCCEEDS')) {
                                        let twoPointText = play.alternativeText.slice(play.alternativeText.indexOf('TWO-POINT'));
                                        if(twoPointText.includes('rush')) {
                                            pointAfterType = 16;
                                        } else {
                                            pointAfterType = 15;
                                        }
                                    } else if(play.alternativeText.includes('Conversion Failed')) {
                                        pointAfterType = -1;
                                    }
                                }
                            }
                            if(play.scoreValue == 6 && pointAfterType == 61) {
                                scoreValue = 7;
                            } else if(play.scoreValue == 6 && (pointAfterType == 15 || pointAfterType == 16)) {
                                scoreValue = 8;
                            } else {
                                scoreValue = play.scoreValue;
                            }
                            if(playType == 17 || playType == 37 || playType == 32) {        // TO-DO add field goal kick 6 & 2pt return score
                                scoreAgainstDEF = false;
                                scoreAgainstOppDEF = true;
                                if(playTeam == homeEspn) {
                                    homeDefPtsAllowed += scoreValue;
                                } else {
                                    awayDefPtsAllowed += scoreValue;
                                }
                                scoreValueAgainstOppDEF = scoreValue;
                            } else if(playType== 36 || playType == 39 || playType == 29 || playType == 20) {    // pick 6 / fumble 6 / safety
                                if(scoreValue == 6 || scoreValue == 2) {
                                    scoreAgainstDEF = false;
                                    scoreAgainstOppDEF = false;
                                } else if(scoreValue > 6) {
                                    scoreAgainstDEF = false;
                                    scoreAgainstOppDEF = true;
                                    if(playTeam == homeEspn) {
                                        homeDefPtsAllowed += scoreValue - 6;
                                    } else {
                                        awayDefPtsAllowed += scoreValue - 6;
                                    }
                                    scoreValueAgainstOppDEF = scoreValue - 6;
                                } 
                            } else {
                                scoreAgainstDEF = true;
                                scoreAgainstOppDEF = false;
                                if(playTeam == homeEspn) {
                                    awayDefPtsAllowed += scoreValue;
                                } else {
                                    homeDefPtsAllowed += scoreValue;
                                }
                                scoreValueAgainstDEF = scoreValue;
                            }
                        }
                        // the play object with all necessary info
                        const playEntry = {
                            playID: play.id,
                            order: parseInt(play.sequenceNumber),
                            playType: playType,
                            team: playTeam,
                            oppTeam,
                            description: play.alternativeText,
                            secondDescription: play.shortAlternativeText,
                            scoringPlay,
                            scoringType,
                            pointAfterType,
                            scoreValue,
                            scoreValueAgainstDEF,
                            scoreValueAgainstOppDEF,
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
                            injuredStarter: new Boolean (false),
                            injuryInfo: [],
                        }
                        // flagging injuries
                        if(play.alternativeText.includes('injured')) {
                            let injuredPlayer = checkInjury(play.alternativeText, startersArray);
                            if(injuredPlayer != null) {
                                playEntry.injuredStarter = true;
                                playEntry.injuryInfo.push(injuredPlayer);
                            }
                        }
                        // get penalty info
                        if(noPlay == false && play.alternativeText.includes('PENALTY') && play.alternativeText.includes('enforced')) {
                            let truePenaltyInfo = getTruePenalty(playTeam, oppTeam, play.alternativeText, play.shortAlternativeText, playType, play.statYardage);
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
                        // flagging plays relevant to starters
                        if(noPlay == false && play.participants) {
                            // loop thru every player involved in play
                            for(const playerKey in play.participants) {
                                // which team is player on
                                const linkType = 'info';
                                let espnPlayerInfo = await parseEspnTeamID(play.participants[playerKey].athlete.$ref, linkType);
                                let playerTeam;
                                let playerTeam_sleeper;
                                for(const key in nflTeams) {
                                    if(nflTeams[key].espnID == espnPlayerInfo.t) {
                                        playerTeam = nflTeams[key].espnAbbreviation;
                                        playerTeam_sleeper = key;
                                        break;
                                    }
                                }

                                // Catching exceptions with different names
                                if(espnPlayerInfo.fn == 'William' && espnPlayerInfo.ln == 'Fuller V') {
                                    espnPlayerInfo.fn == 'Will';
                                    espnPlayerInfo.ln == 'Fuller';
                                } else if(espnPlayerInfo.fn == 'Jeff' && espnPlayerInfo.ln == 'Wilson Jr.') {
                                    espnPlayerInfo.fn = 'Jeffery';
                                    espnPlayerInfo.ln = 'Wilson';
                                }
                                if(espnPlayerInfo.ln.includes('Jr.') || espnPlayerInfo.ln.includes('Sr.') || espnPlayerInfo.ln.includes('III')) {
                                    espnPlayerInfo.ln = espnPlayerInfo.ln.slice(0, espnPlayerInfo.ln.length - 4);
                                } else if(espnPlayerInfo.ln.includes('II')) {
                                    espnPlayerInfo.ln = espnPlayerInfo.ln.slice(0, espnPlayerInfo.ln.length - 3);
                                } else if(espnPlayerInfo.ln.slice(espnPlayerInfo.ln.length - 2) == ' V') {
                                    espnPlayerInfo.ln = espnPlayerInfo.ln.slice(0, espnPlayerInfo.ln.length - 2);
                                }
                                if(espnPlayerInfo.pos == 'PK') {
                                    espnPlayerInfo.pos = 'K';
                                }
                                if(espnPlayerInfo.pos == 'FB') {
                                    espnPlayerInfo.pos = 'RB';
                                }
                                let sleeperMatch = startersArray.filter(s => s.fn == espnPlayerInfo.fn && s.ln == espnPlayerInfo.ln && s.pos == espnPlayerInfo.pos);
                                // if the current player involved in the play is a starter, we combine the sleeper and espn info for their entry in the playEntry
                                if(sleeperMatch.length > 0) {
                                    // assigning correct team if player has retired (& thus Sleeper team info is blank)
                                    if(sleeperMatch[0].t == null || sleeperMatch[0].t != playerTeam_sleeper) {
                                        sleeperMatch[0].t = playerTeam_sleeper;
                                        playersInfo.players[sleeperMatch[0].playerID].t = playerTeam_sleeper;
                                    }
                                    const relevantEntry = {
                                        playerInfo: sleeperMatch[0],
                                        manager: sleeperMatch[0].owner,
                                        statType: play.participants[playerKey].type,
                                        yards: play.statYardage, 
                                        playType: playType,
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
                                if(noPlay == false && (homeDefStarted == true || awayDefStarted == true)) {
                                    let relevantDefEntry = isDefRelevant(play, playType, playTeam, homeDefStarted, awayDefStarted, homeEspn, awayEspn, homeDefense, awayDefense, playerKey, playerTeam);
                                    if(relevantDefEntry != null) {
                                        playEntry.relevantDEF.push(relevantDefEntry);
                                    }            
                                }
                            }
                            // only push on plays involving starters, and not called back for penalty (deal with those separately)
                            if(noPlay == false && (playEntry.relevantPlayers.length > 0 || playEntry.relevantDEF.length >  0 || playEntry.scoringPlay == true || playEntry.injuredStarter == true)) {
                                fantasyRelevantPlaysForward.push(playEntry);
                            } 
                        }
                    }
                }

                if(homeDefStarted == true) {
                    let fantasyYardsInfo = calculateDefYardsAllowed(homeDefYdsAllowed);
                    const statDesc = 'YDS ALW:';
                    let runningTotal = pushRunningTotal(fantasyYardsInfo.DEFscore, statDesc, fantasyYardsInfo.DEFthreshold, homeDefYdsAllowed, homeDefense.playerID, homeDefense.pos);
                    let fantasyPointsInfo = calculateDefPointsAllowed(homeDefPtsAllowed);
                    const statDescPTS = 'PTS ALW:';
                    let runningTotalPTS = pushRunningTotal(fantasyPointsInfo.DEFscore, statDescPTS, fantasyPointsInfo.DEFthreshold, homeDefPtsAllowed, homeDefense.playerID, homeDefense.pos);
                }
                if(awayDefStarted == true) {
                    let fantasyYardsInfo = calculateDefYardsAllowed(awayDefYdsAllowed);
                    const statDesc = 'YDS ALW:';
                    let runningTotal = pushRunningTotal(fantasyYardsInfo.DEFscore, statDesc, fantasyYardsInfo.DEFthreshold, awayDefYdsAllowed, awayDefense.playerID, awayDefense.pos);
                    let fantasyPointsInfo = calculateDefPointsAllowed(awayDefPtsAllowed);
                    const statDescPTS = 'PTS ALW:';
                    let runningTotalPTS = pushRunningTotal(fantasyPointsInfo.DEFscore, statDescPTS, fantasyPointsInfo.DEFthreshold, awayDefPtsAllowed, awayDefense.playerID, awayDefense.pos);
                }

                // IF DEF is started && IF stats count, loop thru drives API to flag 4th down stops, 3 & outs, etc
                if((gameState == 'in' || gameState == 'post') && (homeDefStarted == true || awayDefStarted == true) && (score.def_3_and_out || score.def_4_and_stop)) { 
                    let drivesData = await getGameDrives(gameSelection, true).catch((err) => { console.error(err); });
                    let drivesKey = drivesData.length;

                    for(let d = 0; d < drivesKey; d++) {
                        let driveData = drivesData[d].items;

                        for(let e = 0; e < driveData.length; e++) {
                            let drive = driveData[e];
                                
                            if(score.def_3_and_out && drive.offensivePlays == 3 && drive.result == 'PUNT') {
                                let lastPlay = drive.plays.items[drive.plays.items.length - 1];
                                if(!lastPlay.participants) {
                                    lastPlay = drive.plays.items[drive.plays.items.length - 2];
                                }
                                let linkType = 'participants';
                                let espnTeamID = await parseEspnTeamID(lastPlay.participants[0].athlete.$ref, linkType);

                                let playTeam;
                                let oppTeam;
                                let defense;

                                for(const key in nflTeams) {
                                    if(nflTeams[key].espnID == espnTeamID) {
                                        playTeam = nflTeams[key].espnAbbreviation;
                                        break;
                                    }
                                }
                                if((playTeam == homeEspn && awayDefStarted == false) || (playTeam == awayEspn && homeDefStarted == false)) {
                                    continue;
                                } else {
                                    if(playTeam == homeEspn) {
                                        oppTeam = awayEspn;
                                        defense = awayDefense;
                                    } else {
                                        oppTeam = homeEspn;
                                        defense = homeDefense;
                                    }
                                }
                                // the play object with all necessary info
                                const playEntry = {
                                    playID: lastPlay.id,
                                    order: parseInt(lastPlay.sequenceNumber),
                                    playType: '3andout',
                                    team: playTeam,
                                    oppTeam,
                                    description: lastPlay.alternativeText,
                                    secondDescription: lastPlay.shortAlternativeText,
                                    scoringPlay: false,
                                    scoringType: null,
                                    pointAfterType: null,
                                    scoreValue: 0,
                                    scoreValueAgainstDEF: 0,
                                    scoreValueAgainstOppDEF: 0,
                                    yards: lastPlay.statYardage,
                                    relevantPlayers: [],
                                    relevantDEF: [],
                                    scoreAgainstDEF: false,
                                    scoreAgainstOppDEF: false,
                                    teamStartPoss: lastPlay?.start.team?.$ref || null,
                                    teamEndPoss: lastPlay?.end.team?.$ref || null,
                                    noPlay: false,
                                    penalty: new Boolean (false),
                                    penaltyInfo: null,
                                    injuredStarter: new Boolean (false),
                                    injuryInfo: [],
                                }

                                const relevantEntry = {
                                    playerInfo: defense,
                                    manager: defense.owner,
                                    statType: lastPlay.participants[0].type,
                                    yards: lastPlay.statYardage, 
                                    playType: '3andout',
                                    oppDef: playTeam,
                                }
                                playEntry.relevantDEF.push(relevantEntry);
                                fantasyRelevantPlaysForward.push(playEntry);
                            } else if(score.def_4_and_stop && drive.result == 'DOWNS') {
                                let lastPlay = drive.plays.items[drive.plays.items.length - 1];
                                if(!lastPlay.participants) {
                                    lastPlay = drive.plays.items[drive.plays.items.length - 2];
                                }
                                let linkType = 'participants';
                                let espnTeamID = await parseEspnTeamID(lastPlay.participants[0].athlete.$ref, linkType);
                                let playTeam;
                                let oppTeam;
                                let defense;

                                for(const key in nflTeams) {
                                    if(nflTeams[key].espnID == espnTeamID) {
                                        playTeam = nflTeams[key].espnAbbreviation;
                                        break;
                                    }
                                }
                                if((playTeam == homeEspn && awayDefStarted == false) || (playTeam == awayEspn && homeDefStarted == false)) {
                                    continue;
                                } else {
                                    if(playTeam == homeEspn) {
                                        oppTeam = awayEspn;
                                        defense = awayDefense;
                                    } else {
                                        oppTeam = homeEspn;
                                        defense = homeDefense;
                                    }
                                }
                                // the play object with all necessary info
                                const playEntry = {
                                    playID: lastPlay.id,
                                    order: parseInt(lastPlay.sequenceNumber),
                                    playType: '4thdown',
                                    team: playTeam,
                                    oppTeam,
                                    description: lastPlay.alternativeText,
                                    scoringPlay: false,
                                    scoringType: null,
                                    pointAfterType: null,
                                    scoreValue: 0,
                                    scoreValueAgainstDEF: 0,
                                    scoreValueAgainstOppDEF: 0,
                                    yards: lastPlay.statYardage,
                                    relevantPlayers: [],
                                    relevantDEF: [],
                                    scoreAgainstDEF: false,
                                    scoreAgainstOppDEF: false,
                                    teamStartPoss: lastPlay?.start.team?.$ref || null,
                                    teamEndPoss: lastPlay?.end.team?.$ref || null,
                                    noPlay: false,
                                    penalty: new Boolean (false),
                                    penaltyInfo: null,
                                    injuredStarter: new Boolean (false),
                                    injuryInfo: [],
                                }

                                const relevantEntry = {
                                    playerInfo: defense,
                                    manager: defense.owner,
                                    statType: lastPlay.participants[0].type,
                                    yards: lastPlay.statYardage, 
                                    playType: '4thdown',
                                    oppDef: playTeam,
                                }
                                playEntry.relevantDEF.push(relevantEntry);
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
                //     15: '2pt pass conversion',
                //     16: '2pt rush conversion',
                //     17: 'blocked punt',
                //     18: 'blocked field goal',
                //     20: 'safety',
                //     21: 'timeout',
                //     24: 'completed pass',
                //     26: 'interception (return)',
                //     29: 'fumble turnover'
                //     32: 'kick six'
                //     36: 'pick six',
                //     37: 'blocked punt td',
                //     39: 'fumble six',
                //     43: 'blocked PAT',
                //     52: 'punt',
                //     53: 'kickoff (no return)',
                //     59: 'FG good',
                //     60: 'FG miss',
                //     61: 'PAT good',
                //     62: 'PAT missed',
                //     65: 'half-time',
                //     66: 'end game',
                //     67: 'pass TD', 
                //     68: 'rush TD',
                //     70: 'coin toss',
                //     74: 'official timeout',
                //     75: '2-min warning',
                // }

                let fantasyRelevantPlays = fantasyRelevantPlaysForward.slice().reverse();
                let fantasyProducts_game = processPlays(fantasyRelevantPlays, defYdsThreshBreakers, homeDefStarted, awayDefStarted, homeEspn, awayEspn, homeDefense, awayDefense, homeDefPtsAllowed, awayDefPtsAllowed, gameState, startersArray);
                fantasyProducts = fantasyProducts_game;
                fantasyProducts = fantasyProducts.filter(p => p.length > 0);
                fantasyProducts = fantasyProducts.sort((a, b) => b[0]?.order - a[0]?.order);
            }
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

            if(viewPlayerID != null && viewPlayerID != 'flush') {
                filteredProducts = filteredProducts.filter(p => p.some(p => p.playerInfo.playerID == viewPlayerID));
            }
            filteredProducts = filteredProducts.sort((a, b) => b[0]?.order - a[0]?.order);
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
		background-color: var(--gcMain);
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
        background-color: var(--gcBox);
        margin: 0.3% 0;
        padding: 0.5% 0 0 0;
        border-radius: 1em;
        box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 30%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 3px 2px rgb(0 0 0 / 30%);
    }

    .playMainRow {
        display: inline-flex;
        background-color: var(--gcComponent);
        position: relative;
        padding: 0.5em;
        margin: 0.3% 1.5%;
        border-radius: 0.8em;
        font-size: 1.1em;
        font-weight: 420;
        width: 97%;
        align-items: center;
        justify-content: center;
        box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 30%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 3px 2px var(--gcScoreShadow);
    }

    .injury {
        display: inline-flex;
        align-items: center;
        position: relative;
        height: 44px;
        width: auto;
        margin: 0 0.2% 0 1.7%;
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

    .noPlays {
        color: var(--gcPlayRowText);
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
        color: var(--gcPlayRowText);
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
        background-color: var(--gcComponent);
    }

    .defenseAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 2.6em;
        margin: 0 1.1em;
        justify-content: center;
        height: fit-content;
        background-color: var(--gcComponent);
    }

    .playerName {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 38%;
        color: var(--gcPlayRowText);
        justify-content: left;
        align-content: center;
    }

    .shortDescription {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 35%;
        color: var(--gcPlayRowText);
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
        color: var(--gcPlayText);
        justify-content: center;
        align-content: center;
    }

    .modal {
        display: inline-flex;
        flex-direction: column;
        position: absolute; 
        z-index: 1; 
        width: 100%;
        height: 99%; 
        background-color: rgb(0,0,0); 
        background-color: rgba(0,0,0,0.8); 
        justify-content: center;
        align-items: center;
    }

    .columnWrap {
        display: inline-flex;
        position: relative;
        flex-direction: column;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
    }

    .modalContent {
        justify-content: center;
        align-items: center;
        color: #ededed;
    }

</style>

    <div class="bigBox">
        {#await fantasyProducts}
            <div class="columnWrap">
                Loading Fantasy Play by Play...
                <LinearProgress indeterminate />
            </div>
        {:then fantasyProducts}
            {#if newLoading}
                <div class="modal">
                    <div class="modalContent">Loading Fantasy Play by Play...</div>
                    <LinearProgress indeterminate />
                </div>
            {/if}
            {#if !fantasyProducts.fantasyProducts.length > 0}
                <div class="noPlays">No plays yet...</div>
            {:else}
                {#each filteredProducts as filteredProduct}
                    <div class="playContainer">
                        {#if filteredProduct[0] && filteredProduct[0]?.fpts != 0}
                            {#each filteredProduct as play}
                                <div class="playMainRow" style="{play.side == 'injury' ? "background-color: var(--gcInjury)" : null}">
                                    {#if play.side != 'injury'}
                                        <div class="{play.fpts > 0 ? "pointsPositive" : "pointsNegative"}">
                                            {#if play.fpts > 0}
                                                +{round(play.fpts)}
                                            {:else}
                                                {round(play.fpts)}
                                            {/if}
                                        </div>
                                    {:else}
                                        <img src="./injury.png" class="injury" alt="injury" />
                                    {/if}
                                    {#if play.side == 'offense' || play.side == 'injury'}
                                        <img class="playerAvatar" style="{play.side == 'injury' ? "background-color: var(--gcInjury)" : null}" src="{play.playerInfo ? play.playerInfo.avatar : "https://sleepercdn.com/images/v2/icons/player_default.webp"}" alt="{play.playerInfo ? play.playerInfo.ln : "Player"}">
                                    {:else}
                                        <img class="defenseAvatar" src="{play.playerInfo ? play.playerInfo.avatar : "https://sleepercdn.com/images/v2/icons/player_default.webp"}" alt="{play.playerInfo ? play.playerInfo.ln : "Player"}">
                                    {/if}
                                    {#if play.side == 'offense' || play.side == 'injury'}
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
