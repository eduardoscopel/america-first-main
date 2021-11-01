<script>
    import { getPlayByPlay, waitForAll, round } from '$lib/utils/helper'; 

    export let nflMatchups, leagueData, fantasyStarters, managerInfo, playersInfo, gameSelection;

    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/situation?lang=en&region=us CURRENT DOWN
    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/plays?lang=en&region=us PLAY BY PLAY
    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/competitors/22/statistics?lang=en&region=us GAME STATS
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436?lang=en&region=us GAME
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks ALL WEEKS
    let startersArray = [];
    let fantasyPlays;

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
                const starterInfo = playersInfo.players[starter];
                const starterEntry = {
                    playerID: starter,
                    owner: managerInfo[recordManID],
                    fn: starterInfo?.fn || null,
                    ln: starterInfo?.ln || null,
                    pos: starterInfo?.pos || null,
                    t: starterInfo?.t || null,
                }
                startersArray.push(starterEntry);
            }
        }
        // identify NFL teams in the current game
        let game = nflMatchups.filter(m => m[0].gameID == gameSelection)[0];
        let home = game[0].sleeperID;
        let away = game[1].sleeperID;

        // work backwards from most recent PBP page
        for(let i = recencyKey; i > 0; i--) {
            let playsData = playByPlayData[i - 1].items;
            // work backwards from most recent play
            for(let p = playsData.length; p > 0; p--) {
                let play = playsData[p - 1];
                // for flagging scoring plays
                let scoringPlay = new Boolean (false);
                let scoringType;
                let scoreValue;
                if(play.scoreValue > 0) {
                    scoringPlay = true;
                    scoringType = play.scoringType.name;
                    scoreValue = play.scoreValue;
                } else {
                    scoringPlay = false;
                    scoringType = null;
                    scoreValue = 0;
                }
                // the play object with all necessary info
                const playEntry = {
                    description: play.alternativeText,
                    scoringPlay,
                    scoringType,
                    scoreValue,
                    relevantPlayers: [],
                    teamStartPoss: play.start.team?.$ref || null,
                    teamEndPoss: play?.end.team.$ref || null,
                }
                // some "plays" in API don't have participants (ex. coin-toss)
                if(play.participants) {
                    // loop thru every player involved in play
                    for(const playerKey in play.participants) {
                        // ESPN PBP API includes direct links to player APIs
                        const espnPlayerLink = play.participants[playerKey].athlete.$ref; 
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
                    }
                }
                // only push on plays involving starters
                if(playEntry.relevantPlayers.length > 0) {
                    fantasyRelevantPlays.push(playEntry);
                }
            }
        }
        
        // now that we've filtered our relevant plays, we calculate the fpts each produced
        let fantasyProducts = [];
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
        //     36: 'pick six',
        //     52: 'punt',
        //     53: 'kickoff',
        //     59: 'FG good',
        //     66: 'end game',
        //     67: 'pass TD', 
        //     68: 'rush TD',
        //     70: 'coin toss',
        //     75: '2-min warning',
        // }

        for(const playKey in fantasyRelevantPlays) {
            const play = fantasyRelevantPlays[playKey];

            for(const relevantKey in play.relevantPlayers) {
                const player = play.relevantPlayers[relevantKey];       // NOTE TO-DO: ACCOUNT FOR PENALTIES (unclear how/when penalties screw with ESPN's yardage value)
                if(player.statType == 'fumbler') {                  // FUMBLE 
                    const fpts = (score?.fum || 0);             // PENALTY for FUMBLE FORCED
                    const entry = {
                        manager: player.manager,
                        playerInfo: player.playerInfo,
                        stat: ['fum'],
                        fpts,
                        yards: player.yards,
                        description: play.description,
                    }                   
                    if(play.teamStartPoss != play.teamEndPoss && score.fum_lost) {      // PENALTY for FUMBLE -> TURNOVER
                        entry.fpts += score.fum_lost;                                   // note that it's not necessarily one or the other
                        entry.stat.push('fum_lost');
                    }
                    fantasyProducts.push(entry);
                } else if(player.statType == 'recoverer'
                        && player.playType != '9' 
                        && play.teamStartPoss != play.teamEndPoss) {   
                            if(startersArray.filter(s => s.playerID == player.playerInfo.t).length > 0) {                    // FUMBLE RECOVERY PTS - TEAM DEF
                                const defense = startersArray.filter(s => s.playerID == player.playerInfo.t)[0];
                                const fpts = (score?.fum_rec || 0);            // NOTE TO-DO: Must distinguish b/t def & st recoveries; also IDP 
                                const entryDEF = {
                                    manager: defense.owner,
                                    playerInfo: defense.playerInfo,
                                    stat: ['fum_rec'],
                                    fpts,
                                    description: play.description,
                                }   
                                fantasyProducts.push(entryDEF);
                            }
                            if(score.idp_fum_rec) {                                 // FUMBLE RECOVERY IDP
                                const entryIDP = {
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['idp_fum_rec'],
                                    fpts: score.idp_fum_rec,
                                    description: play.description,
                                }
                                fantasyProducts.push(entryIDP);
                            }
                } else if(player.playType == '9' && startersArray.filter(s => s.playerID == player.oppDef).length > 0) {          // FORCED FUMBLE PTS - TEAM DEF
                    const defense = startersArray.filter(s => s.playerID == player.oppDef)[0];    
                    const fpts = (score?.ff || 0);            
                    const entryDEF = {
                        manager: defense.owner,
                        playerInfo: defense.playerInfo,
                        stat: ['ff'],
                        fpts,
                        description: play.description,
                    }
                    fantasyProducts.push(entryDEF);
                } else if(player.statType == 'forcedBy' // TO-DO make sure ALL potential fpts-scoring plays are calculated - we'll filter out the ones the leaague doesn't count later
                        && player.playType != '53' // no kickoffs or punts (TO-DO: field goals)
                        && player.playType != '52') {  
                            if(player.playType == '9') {                        // FUMBLE FORCED PTS - IDP
                                const fpts = (score?.idp_ff || 0);            
                                const entryIDP = {
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['idp_ff'],
                                    fpts,
                                    description: play.description,
                                }
                                fantasyProducts.push(entryIDP);
                            }  
                }
                if(player.playType == '5' && player.statType == 'rusher') {         // RUSH
                    const fpts = player.yards * (score?.rush_yd || 0) + (score?.rush_att || 0);
                    const entry = {
                        manager: player.manager,
                        playerInfo: player.playerInfo,
                        stat: ['rush_yd', 'rush_att'],
                        fpts,
                        yards: player.yards,
                        description: play.description,
                    }
                    if(player.yards >= 40 && score.rush_40p) {          // RUSH YD BONUS
                        entry.fpts += score.rush_40p;
                        entry.stat.push('rush_40p');
                    }
                    fantasyProducts.push(entry);
                } else if(player.playType == '68' && player.statType == 'rusher') {            // RUSH TD  NOTE TO-DO: ACCOUNT FOR LATERALS (SAME WITH REC TDs)
                    const fpts = player.yards * (score?.rush_yd || 0) + (score?.rush_att || 0) + (score?.rush_td || 0);
                    const entry = {
                        manager: player.manager,
                        playerInfo: player.playerInfo,
                        stat: ['rush_yd', 'rush_att', 'rush_td'],
                        fpts,
                        yards: player.yards,
                        description: play.description,
                    }
                    if(40 <= player.yards < 50 && score.rush_td_40p) {          // RUSH TD YD BONUS
                        entry.fpts += score.rush_td_40p;
                        entry.stat.push('rush_td_40p');
                    } else if(player.yards >= 50 && score.rush_td_50p) {
                        entry.fpts += score.rush_td_50p;
                        entry.stat.push('rush_td_50p');
                    }
                    fantasyProducts.push(entry);
                } else if(player.playType == '26') {          // INTERCEPTION
                    if(player.statType == 'passer') {                       // INT QB PENALTY
                        const fpts = (score?.pass_int || 0) + (score?.pass_att || 0);
                        const entry = {
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['pass_int', 'pass_att'],
                            fpts,
                            description: play.description,
                        }  
                        fantasyProducts.push(entry);
                    } 
                    if(startersArray.filter(s => s.playerID == player.oppDef).length > 0) {            // INT TEAM DEF
                        const defense = startersArray.filter(s => s.playerID == player.oppDef)[0];
                        const fpts = (score?.int || 0) + player.yards * (score?.int_ret_yd || 0);
                        const entryDEF = {
                            manager: defense.owner,
                            playerInfo: defense.playerInfo,
                            stat: ['int', 'int_ret_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }
                        fantasyProducts.push(entryDEF);
                    }             
                } else if(player.playType == '36') {            // PICK SIX
                    if(player.statType == 'scorer' && startersArray.filter(s => s.playerID == player.playerInfo.t).length > 0) {        // P6 TEAM DEF
                        const defense = startersArray.filter(s => s.playerID == player.playerInfo.t)[0];
                        const fpts = (score?.def_td || 0) + (score?.int || 0) + player.yards * (score?.int_ret_yd || 0);
                        const entryDEF = {
                            manager: defense.owner,
                            playerInfo: defense.playerInfo,
                            stat: ['def_td', 'int', 'int_ret_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }
                        fantasyProducts.push(entryDEF);
                    }    
                    if(player.statType == 'scorer' && (score.idp_int || score.idp_def_td || score.idp_int_ret_yd)) {        // P6 IDP
                        const fpts = (score?.idp_int || 0) + (score?.idp_def_td || 0) + player.yards * (score?.idp_int_ret_yd || 0);
                        const entryIDP = {
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['idp_int', 'idp_def_td', 'idp_int_ret_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }
                        if(player.yards >= 50 && score.bonus_def_int_td_50p) {                  // P6 IDP YD BONUS
                            entryIDP.fpts += score.bonus_def_int_td_50p;
                            entryIDP.stat.push('bonus_def_int_td_50p');
                        }
                        fantasyProducts.push(entryIDP);
                    }   
                    if(player.statType == 'passer') {                       // P6 QB PENALTY
                        const fpts = (score?.pass_int || 0) + (score?.pass_inc || 0) + (score?.pass_int_td || 0) + (score?.pass_att || 0);
                        const entry = {
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['pass_int', 'pass_inc', 'pass_int_td', 'pass_att'],
                            fpts,
                            description: play.description,
                        }  
                        fantasyProducts.push(entry);
                    } 
                } else if(player.playType == '24') {          // COMPLETE PASS
                    if(player.statType == 'passer') {
                        const fpts = player.yards * (score?.pass_yd || 0) + (score?.pass_att || 0) + (score?.pass_cmp || 0);
                        const entry = {
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['pass_yd', 'pass_att', 'pass_cmp'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }      
                        if(player.yards >= 40 && score.pass_cmp_40p) {          // PASS YD BONUS
                            entry.fpts += score.pass_cmp_40p;
                            entry.stat.push('pass_cmp_40p');
                        }
                        fantasyProducts.push(entry);
                    } else if(player.statType == 'receiver') {              // RECEPTION
                        const fpts = player.yards * (score?.rec_yd || 0) + (score?.rec || 0);
                        const entry = {
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['rec_yd', 'rec'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }
                        if(0 < player.yards < 5 && score.rec_0_4) {     // RECEPTION YD BONUS
                            entry.fpts += score.rec_0_4;
                            entry.stat.push('rec_0_4');
                        } else if(4 < player.yards < 10 && score.rec_5_9) {
                            entry.fpts += score.rec_5_9;
                            entry.stat.push('rec_5_9');
                        } else if(9 < player.yards < 20 && score.rec_10_19) {
                            entry.fpts += score.rec_10_19;
                            entry.stat.push('rec_10_19');
                        } else if(19 < player.yards < 30 && score.rec_20_29) {
                            entry.fpts += score.rec_20_29;
                            entry.stat.push('rec_20_29');
                        } else if(29 < player.yards < 40 && score.rec_30_39) {
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
                        fantasyProducts.push(entry);
                    }         
                } else if(player.playType == '67') {                         // PASSING TD
                    if(player.statType == 'passer') {
                        const fpts = player.yards * (score?.pass_yd || 0) + (score?.pass_td || 0) + (score?.pass_cmp || 0) + (score?.pass_att || 0);
                        const entry = {
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['pass_yd', 'pass_td', 'pass_cmp', 'pass_att'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }
                        if(40 <= player.yards < 50 && score.pass_td_40p) {          // PASSING TD YD BONUS
                            entry.fpts += score.pass_td_40p;
                            entry.stat.push('pass_td_40p');
                        } else if(player.yards >= 50 && score.pass_td_50p) {
                            entry.fpts += score.pass_td_50p;
                            entry.stat.push('pass_td_50p');
                        }
                        fantasyProducts.push(entry);
                    } else if(player.statType == 'receiver') {                // RECEIVING TD
                        const fpts = player.yards * (score?.rec_yd || 0) + (score?.rec_td || 0) + (score?.rec || 0);
                        const entry = {
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['rec_yd', 'rec_td', 'rec'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }
                        if(40 <= player.yards < 50 && score.rec_td_40p) {          // RECEIVING TD YD BONUS
                            entry.fpts += score.rec_td_40p;
                            entry.stat.push('rec_td_40p');
                        } else if(player.yards >= 50 && score.rec_td_50p) {
                            entry.fpts += score.rec_td_50p;
                            entry.stat.push('rec_td_50p');
                        }
                        fantasyProducts.push(entry);
                    }
                } else if(player.playType == '3' && player.statType == 'passer') {         // INCOMPLETE PASS
                    const fpts = (score?.pass_inc || 0) + (score?.pass_att || 0);
                    const entry = {
                        manager: player.manager,
                        playerInfo: player.playerInfo,
                        stat: ['pass_inc', 'pass_att'],
                        fpts,
                        description: play.description,
                    }
                    fantasyProducts.push(entry);
                } else if(player.playType == '7') {         // SACK - QB
                    if(player.statType == 'passer' && score.pass_sack) {
                        const fpts = score.pass_sack;
                        const entry = {
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['pass_sack'],
                            fpts,
                            description: play.description,
                        }
                        fantasyProducts.push(entry);
                    }
                    if(startersArray.filter(s => s.playerID == player.oppDef).length > 0) {            // SACK - TEAM DEF
                        const defense = startersArray.filter(s => s.playerID == player.oppDef)[0];
                        const fpts = (score?.sack || 0) + player.yards * (score?.sack_yd || 0);
                        const entryDEF = {
                            manager: defense.owner,
                            playerInfo: defense.playerInfo,
                            stat: ['sack', 'sack_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }
                        fantasyProducts.push(entryDEF);
                    }
                } else if(player.playType == '59' && player.statType == 'kicker') {         // MADE FIELD GOAL
                    const fpts = (score?.fgm || 0) + player.yards * (score?.fgm_yds || 0);
                    const entry = {
                        manager: player.manager,
                        playerInfo: player.playerInfo,
                        stat: ['fgm', 'fgm_yds'],
                        fpts,
                        yards: player.yards,
                        description: play.description,
                    }
                    if(0 < player.yards < 20 && score.fgm_0_19) {           // FG YD BONUS
                        entry.fpts += score.fgm_0_19;
                        entry.stat.push(score.fgm_0_19);
                    } else if(19 < player.yards < 30 && score.fgm_20_29) {
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
                        } else if(39 < player.yards < 50 && score.fgm_40_49) {
                            entry.fpts += score.fgm_40_49;
                            entry.stat.push(score.fgm_40_49);
                        } else if(player.yards >= 50 && score.fgm_50p) {
                            entry.fpts += score.fgm_50p;
                            entry.stat.push(score.fgm_50p);
                        } 
                    }   // TO-DO (maybe) NOTE: ADD IF OTHER KINDS OF TOUCHDOWNS  ALSO NOT SURE IF THIS WORKS             //  MISSED EXTRA POINT
                    fantasyProducts.push(entry);
                } else if(((player.playType == '68' || player.playType == '67') || play.scoringType == 'touchdown') 
                            && play.scoreValue == 6 
                            && player.statType == 'patScorer'
                            && score.xpmiss) {
                                const fpts = score.xpmiss || 0;
                                const entry = {
                                    manager: player.manager,
                                    playerInfo: player.playerInfo,
                                    stat: ['xpmiss'],
                                    fpts,
                                    description: play.description,
                                }   
                                fantasyProducts.push(entry);                                                                                    
                } else if(player.playType == '12') {
                    if(startersArray.filter(s => s.playerID == player.playerInfo.t).length > 0) {                  // KICKOFF RETURN TEAM DEF
                        const defense = startersArray.filter(s => s.playerID == player.playerInfo.t)[0];
                        const fpts = player.yards * (score?.def_kr_yd || 0);
                        const entryDEF = {
                            manager: defense.owner,
                            playerInfo: defense.playerInfo,
                            stat: ['def_kr_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }
                        fantasyProducts.push(entryDEF);
                    }
                    if(player.statType == 'returner') {
                        const fpts = player.yards * (score?.kr_yd || 0);
                        const entry = {
                            manager: player.manager,
                            playerInfo: player.playerInfo,
                            stat: ['kr_yd'],
                            fpts,
                            yards: player.yards,
                            description: play.description,
                        }
                        fantasyProducts.push(entry);
                    }
                }                         
            }
        }
        fantasyPlays = fantasyProducts;
        return fantasyProducts; 
    }
    $: fantasyProducts = loadPlayByPlay(gameSelection, startersArray);

</script>

<style>
    .bigBox {
        position: relative;
        z-index: auto;
        margin: 0.5em 0;
        width: 966px;
        height: 666px;
		background-color: var(--f3f3f3);
        overflow-y: auto;
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
    }

    .playContainer {
        display: inline-flexbox;
        width: 100%;
        padding: 2px;
        justify-content: space-evenly;
        align-content: center;
    }

    .pointsPositive {
        display: inline-flex;
        color: green;
    }

    .pointsNegative {
        display: inline-flex;
        color: darkred;
    }

    .manager {
        display: inline-flex;
        width: auto;
        justify-content: center;
        align-content: center;
    }

    .description {
        display: flex;
        width: 66em;
        justify-content: center;
        align-content: center;
    }

</style>

    <div class="bigBox">
        {#await fantasyProducts}
            Just wait...
        {:then fantasyProducts}
            {#each fantasyProducts as play}
                {#if play.fpts != 0}
                    <div class="playContainer">
                        <div class="{play.fpts > 0 ? "pointsPositive" : "pointsNegative"}">
                            {round(play.fpts)}
                        </div>
                        <div class="manager">
                            {play.manager.name}
                        </div>
                        <div class="description">
                            {play.description}
                        </div>
                    </div>
                {/if}
            {/each}
        {/await}
            
    </div>
