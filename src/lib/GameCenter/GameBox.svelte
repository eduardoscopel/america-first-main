<script>
    import {round} from '$lib/utils/helper'; 

    export let nflTeams, nflMatchups, week, leagueData, playersInfo, fantasyStarters, positionLeaders, managerInfo, weekMatchups, standingsData, matchSelection = 1, fantasyProducts, gameSelection = nflMatchups[0][0].gameID, viewPlayerID, showGameBox, showMatchBox, leaderBoardInfo;
    
    const score = leagueData.scoring_settings;
    const positions = leagueData.roster_positions.filter(p => p != 'BN');
    const nflPositions = [];
    for(const position in positions) {
        if(!nflPositions.includes(positions[position]) && positions[position] != 'FLEX' && positions[position] != 'WRRB_FLEX' && positions[position] != 'REC_FLEX' && positions[position] != 'SUPER_FLEX') {
            nflPositions.push(positions[position]);
        }
    }
    let freshGame = new Boolean (false);
    let positionLB;
    let positionPlayFilter = [];

    let leaderBoardType;
    let leaderBoardSpec;
    let leaderboardHeading = 'Game';

    let showMatch = new Boolean (false);    // League matchups

    // create top 10 points-scorers arrays for each position
    const positionRankArrays = {};
    if(positions.includes('FLEX')) {
        positionRankArrays['FLEX'] = [];
    }
    if(positions.includes('WRRB_FLEX')) {
        positionRankArrays['WRRB_FLEX'] = [];
    }
    if(positions.includes('REC_FLEX')) {
        positionRankArrays['REC_FLEX'] = [];
    }
    if(positions.includes('SUPER_FLEX')) {
        positionRankArrays['SUPER_FLEX'] = [];
    }
    if(positions.includes('IDP_FLEX')) {
        positionRankArrays['IDP_FLEX'] = [];
    }
    
    for(const position in positionLeaders) {
        positionRankArrays[position] = positionLeaders[position].slice(0, 10);
        if(positions.includes('FLEX') && (position == 'RB' || position == 'WR' || position == 'TE')) {
            for(let i = 0; i < 10 && i < positionLeaders[position].length; i++) {
                positionRankArrays['FLEX'].push(positionLeaders[position][i]);
            }
        }
        if(positions.includes('SUPER_FLEX') && (position == 'QB' || position == 'RB' || position == 'WR' || position == 'TE')) {
            for(let i = 0; i < 10 && i < positionLeaders[position].length; i++) {
                positionRankArrays['SUPER_FLEX'].push(positionLeaders[position][i]);
            }
        }
        if(positions.includes('WRRB_FLEX') && (position == 'RB' || position == 'WR')) {
            for(let i = 0; i < 10 && i < positionLeaders[position].length; i++) {
                positionRankArrays['WRRB_FLEX'].push(positionLeaders[position][i]);
            }
        }
        if(positions.includes('REC_FLEX') && (position == 'WR' || position == 'TE')) {
            for(let i = 0; i < 10 && i < positionLeaders[position].length; i++) {
                positionRankArrays['REC_FLEX'].push(positionLeaders[position][i]);
            }
        }
        if(positions.includes('IDP_FLEX') && (position == 'DL' || position == 'LB' || position == 'DB')) {
            for(let i = 0; i < 10 && i < positionLeaders[position].length; i++) {
                positionRankArrays['IDP_FLEX'].push(positionLeaders[position][i]);
            }
        }
    }
    if(positionRankArrays['FLEX']) {
        positionRankArrays['FLEX'] = positionRankArrays['FLEX'].sort((a, b) => b.fpts - a.fpts).slice(0, 10);
    }
    if(positionRankArrays['SUPER_FLEX']) {
        positionRankArrays['SUPER_FLEX'] = positionRankArrays['SUPER_FLEX'].sort((a, b) => b.fpts - a.fpts).slice(0, 10);
    }
    if(positionRankArrays['WRRB_FLEX']) {
        positionRankArrays['WRRB_FLEX'] = positionRankArrays['WRRB_FLEX'].sort((a, b) => b.fpts - a.fpts).slice(0, 10);
    }
    if(positionRankArrays['REC_FLEX']) {
        positionRankArrays['REC_FLEX'] = positionRankArrays['REC_FLEX'].sort((a, b) => b.fpts - a.fpts).slice(0, 10);
    }
    if(positionRankArrays['IDP_FLEX']) {
        positionRankArrays['IDP_FLEX'] = positionRankArrays['IDP_FLEX'].sort((a, b) => b.fpts - a.fpts).slice(0, 10);
    }
    // assign managers for selected matchID
    const displayMatch = (matchSelection) => {
        let match = weekMatchups[matchSelection];
        const projections = {};
        const matchStarters = {};
        for(const opponent in match) {
            projections[match[opponent].recordManID] = 0;
            for(const starter of match[opponent].starters) {
                if(starter != '0') {
                    const starterInfo = playersInfo.players[starter];
                    const starterEntry = {
                        playerID: starter,
                        fpts: match[opponent].points[match[opponent].starters.indexOf(starter)],
                        rosterSpot: positions[match[opponent].starters.indexOf(starter)],
                        owner: managerInfo[match[opponent].recordManID],
                        recordManID: match[opponent].recordManID,
                        fn: starterInfo.fn,
                        ln: starterInfo.ln,
                        pos: starterInfo.pos,
                        t: starterInfo.t,
                        projection: Number.parseFloat(starterInfo.wi[week].p),
                        avatar: starterInfo.pos == "DEF" ? `https://sleepercdn.com/images/team_logos/nfl/${starter.toLowerCase()}.png` : `https://sleepercdn.com/content/nfl/players/thumb/${starter}.jpg`,
                        teamAvatar: `https://sleepercdn.com/images/team_logos/nfl/${starterInfo.t.toLowerCase()}.png`,
                        teamColor: `background-color: #${nflTeams[starterInfo.t].color}6b`,
                        teamAltColor: `background-color: #${nflTeams[starterInfo.t].alternateColor}52`,
                    }
                    if(nflTeams[starterInfo.t].color == nflTeams[starterInfo.t].alternateColor && nflTeams[starterInfo.t].color == '000000') {
                        starterEntry.teamAltColor = `background-color: #ffffff52`;
                    }
                    projections[match[opponent].recordManID] += starterEntry.projection;
                    if(!matchStarters[match[opponent].recordManID]) {
                        matchStarters[match[opponent].recordManID] = [];
                    }
                    matchStarters[match[opponent].recordManID].push(starterEntry);
                }
            }
        }
        let records = {
            0: null,
            1: null,
        }
        for(let i = 0; i < match.length; i++) {
            for(const key in standingsData.standingsInfo) {
                if(standingsData.standingsInfo[key].recordManID == match[i].recordManID) {
                    records[i] = {
                        wins: standingsData.standingsInfo[key].wins,
                        ties: standingsData.standingsInfo[key].ties,
                        losses: standingsData.standingsInfo[key].losses,
                        showTies: new Boolean (false),
                    }
                    if(records[i].ties != 0) {
                        records[i].showTies = true;
                    }
                    break;
                }
            }
        }
        let home = {
            matchInfo: match[0],
            manager: managerInfo[match[0].recordManID],
            fpts: match[0].totalFpts,
            projection: projections[match[0].recordManID],
            starters: matchStarters[match[0].recordManID],
            record: records[0],
        }
        let away = {
            matchInfo: match[1],
            manager: managerInfo[match[1].recordManID],
            fpts: match[1].totalFpts,
            projection: projections[match[1].recordManID],
            starters: matchStarters[match[1].recordManID],
            record: records[1],
        }
        freshGame = true;
        positionLB = matchStarters;
        leaderboardHeading = `${managerInfo[home.matchInfo.recordManID].abbreviation} v ${managerInfo[away.matchInfo.recordManID].abbreviation}`;
        return {home, away, matchStarters};
    }
    $: match = displayMatch(matchSelection);

    // assign teams for selected gameID
    const selectGame = (gameSelection) => {
        let game = nflMatchups.filter(m => m[0].gameID == gameSelection)[0];
        let home = game[0].team;
        let away = game[1].team;
        freshGame = true;

        showMatch = false;
        return {home, away};
    }
    $: game = selectGame(gameSelection);

    const positionGameStarters = {
        positions: {},
        rowHeights: {},
    };
    for(const nflPosition of nflPositions){
        positionGameStarters.positions[nflPosition] = [];
    }
    const findStarters = (game) => {
        const gameStarters = {};
        if(!positionGameStarters[game.home.sleeperID]) {
            positionGameStarters[game.home.sleeperID] = {
                starters: [],
            };
        }
        if(!positionGameStarters[game.away.sleeperID]) {
            positionGameStarters[game.away.sleeperID] = {
                starters: [],
            };
        }
        if(!positionGameStarters.rowHeights[gameSelection]) {
            positionGameStarters.rowHeights[gameSelection] = [];
        }
        for(const recordManID in fantasyStarters) {
            const starters = fantasyStarters[recordManID].starters;
            for(const starter of starters) {
                const starterInfo = playersInfo.players[starter];
                if(starter != '0' && (starterInfo.t == game.home.sleeperID || starterInfo.t == game.away.sleeperID)) {
                    const starterEntry = {
                        playerID: starter,
                        fpts: fantasyStarters[recordManID].startersPoints[starters.indexOf(starter)],
                        owner: managerInfo[recordManID],
                        recordManID,
                        fn: starterInfo.fn,
                        ln: starterInfo.ln,
                        pos: starterInfo.pos,
                        t: starterInfo.t,
                        projection: starterInfo.wi[week].p,
                        avatar: starterInfo.pos == "DEF" ? `https://sleepercdn.com/images/team_logos/nfl/${starter.toLowerCase()}.png` : `https://sleepercdn.com/content/nfl/players/thumb/${starter}.jpg`,
                        teamAvatar: `https://sleepercdn.com/images/team_logos/nfl/${starterInfo.t.toLowerCase()}.png`,
                        teamColor: `background-color: #${nflTeams[starterInfo.t].color}6b`,
                        teamAltColor: `background-color: #${nflTeams[starterInfo.t].alternateColor}52`,
                    }
                    if(nflTeams[starterInfo.t].color == nflTeams[starterInfo.t].alternateColor && nflTeams[starterInfo.t].color == '000000') {
                        starterEntry.teamAltColor = `background-color: #ffffff52`;
                    }
                    if(!gameStarters[recordManID]) {
                        gameStarters[recordManID] = [];
                    }
                    gameStarters[recordManID].push(starterEntry);
                    if(!positionGameStarters.positions[starterInfo.pos].includes(starterEntry)) {
                        positionGameStarters.positions[starterInfo.pos].push(starterEntry);
                    }
                }
            }
        }

        if(positionGameStarters[game.home.sleeperID].starters.length == 0) {
            for(const pos in positionGameStarters.positions) {
                positionGameStarters[game.home.sleeperID].starters.push(positionGameStarters.positions[pos].filter(s => s.t == game.home.sleeperID));
                positionGameStarters[game.away.sleeperID].starters.push(positionGameStarters.positions[pos].filter(s => s.t == game.away.sleeperID));
                if(positionGameStarters.positions[pos].filter(s => s.t == game.home.sleeperID).length >= positionGameStarters.positions[pos].filter(s => s.t == game.away.sleeperID).length) {
                    positionGameStarters.rowHeights[gameSelection].push(positionGameStarters.positions[pos].filter(s => s.t == game.home.sleeperID).length);
                } else {
                    positionGameStarters.rowHeights[gameSelection].push(positionGameStarters.positions[pos].filter(s => s.t == game.away.sleeperID).length);
                }
            }
        }
        positionLB = gameStarters;
        leaderboardHeading = `${game.home.sleeperID} v ${game.away.sleeperID}`;
        return gameStarters;
    }
    $: gameStarters = findStarters(game);

    const displayManagers = (gameStarters) => {
        let gameManagers = [];
        const gameManager = {};

        for(const recordManID in gameStarters) {
            if(gameStarters[recordManID].length > 0) {
                if(!gameManager[recordManID]){
                    gameManager[recordManID] = {
                        info: managerInfo[recordManID],
                        starters: gameStarters[recordManID],
                    }
                }
                gameManagers.push(gameManager[recordManID]);
            }
        }
        return gameManagers;
    }
    $: gameManagers = displayManagers(gameStarters);

    export const changePlayer = (viewPlayerID) => {
        let newViewPlayer;
        let newGameSelection;
        if(viewPlayerID == 'flush') {
            newViewPlayer = null;
        } else {
            // if(showMatch == true) {
            //     let newGameStarters = null;
            //     for(const nflMatchup in nflMatchups) {
            //         for(const team in nflMatchups[nflMatchup]) {
            //             if(nflMatchups[nflMatchup][team].sleeperID == playersInfo.players[playerID].t) {
            //                 newGameSelection = nflMatchups[nflMatchup][team].gameID
            //                 let newGame = displayGame(nflMatchups[nflMatchup][team].gameID);
            //                 newGameStarters = findStarters(newGame);
            //                 for(const recordManID in newGameStarters) {
            //                     if(newGameStarters[recordManID].find(s => s.playerID == playerID)) {
            //                         newViewPlayer = newGameStarters[recordManID].find(s => s.playerID == playerID);
            //                         break;
            //                     }
            //                 }
            //                 break;
            //             }
            //         }
            //         if(newGameStarters != null) {
            //             break;
            //         }
            //     }
            // } else {
                for(const recordManID in gameStarters) {
                    if(gameStarters[recordManID].find(s => s.playerID == viewPlayerID)) {
                        newViewPlayer = gameStarters[recordManID].find(s => s.playerID == viewPlayerID);
                        break;
                    }
                }
            // }
        }
        viewPlayer = newViewPlayer;
        getDisplayStats(viewPlayer);
        return viewPlayer;
    }
    $: viewPlayer = changePlayer(viewPlayerID);

    // const changePosition = (position) => {
    //     positionLB = position;
    //     if(positionLB == 'DEF') {
    //         leaderboardHeading = 'Defense';
    //     } else if(positionLB == 'QB') {
    //         leaderboardHeading = 'Quarterback';
    //     } else if(positionLB == 'RB') {
    //         leaderboardHeading = 'Running Back';
    //     } else if(positionLB == 'WR') {
    //         leaderboardHeading = 'Wide Receiver';
    //     } else if(positionLB == 'TE') {
    //         leaderboardHeading = 'Tight End';
    //     } else if(positionLB == 'K') {
    //         leaderboardHeading = 'Kicker';
    //     } else if(positionLB == 'DB') {
    //         leaderboardHeading = 'Defensive Back';
    //     } else if(positionLB == 'DL') {
    //         leaderboardHeading = 'Defensive Lineman';
    //     } else if(positionLB == 'LB') {
    //         leaderboardHeading = 'Linebacker';
    //     } else if(positionLB == 'FLEX') {
    //         leaderboardHeading = 'FLEX';
    //     } else if(positionLB == 'SUPER_FLEX') {
    //         leaderboardHeading = 'Super FLEX';
    //     } else if(positionLB == 'WRRB_FLEX') {
    //         leaderboardHeading = 'WR/RB FLEX';
    //     } else if(positionLB == 'REC_FLEX') {
    //         leaderboardHeading = 'WR/TE FLEX';
    //     } else if(positionLB == 'IDP_FLEX') {
    //         leaderboardHeading = 'IDP FLEX';
    //     }
    // }

    const getDisplayStats = async (viewPlayer) => {
        let newFantasyProducts = await fantasyProducts;
        const viewPlayerStats = {};
        let displayStats = [];
        if(newFantasyProducts.length > 0 && viewPlayer != null  && newFantasyProducts[newFantasyProducts.length - 1][viewPlayer.playerID]) {
            let runningTotals = newFantasyProducts[newFantasyProducts.length - 1];
            viewPlayerStats[viewPlayer.playerID] = {
                stats: [],
                totalFpts: runningTotals[viewPlayer.playerID]?.totalFpts || null,
                playerID: viewPlayer.playerID,
            }
            for(const stat in runningTotals[viewPlayer.playerID].stats) {
                viewPlayerStats[viewPlayer.playerID].stats.push(runningTotals[viewPlayer.playerID].stats[stat]);
            }
            displayStats.push(viewPlayerStats[viewPlayer.playerID]);
        } else {
            displayStats = null;
        }
        return displayStats;
    }
    $: displayStats = getDisplayStats(viewPlayer);

    const getPositionLeaders = (positionLB) => {
        let positionLeaderboard = [];
        if(freshGame == false) {
            positionLeaderboard = positionRankArrays[positionLB];
        } else if(freshGame == true) {
            for(const recordManID in positionLB) {
                for(const starter of positionLB[recordManID]) {
                    positionLeaderboard.push(starter);
                }
            }
            positionLeaderboard = positionLeaderboard.sort((a, b) => b.fpts - a.fpts).slice(0, 10);
            freshGame = false;
        }
        return positionLeaderboard;
    }
    $: positionLeaderboard = getPositionLeaders(positionLB);

    const multiFunction = (playerID, teamID, leaderBoardType, leaderBoardSpec) => {
        if(playerID != null && teamID != null) {
            let newGameSelection = null;
            for(const nflMatchup in nflMatchups) {
                for(const team in nflMatchups[nflMatchup]) {
                    if(nflMatchups[nflMatchup][team].sleeperID == teamID) {
                        newGameSelection = nflMatchups[nflMatchup][team].gameID
                        break;
                    }
                }
                if(newGameSelection != null) {
                    break;
                }
            }
            gameSelection = newGameSelection;
            viewPlayerID = playerID;
        }
        if(leaderBoardType != null && leaderBoardSpec != null) {
            if(leaderBoardType == 'matchup') {
                matchSelection = leaderBoardSpec;
            } 
            changeLeaderBoard(leaderBoardType, leaderBoardSpec);
        }
    }

    const changeLeaderBoard = (leaderBoardType, leaderBoardSpec) => {
        if(leaderBoardType == 'position') {
            let newPlayFilter;
            if(positionPlayFilter.length > 0 && positionPlayFilter.includes(leaderBoardSpec)) {
                newPlayFilter = positionPlayFilter.filter(p => p != leaderBoardSpec);
                positionPlayFilter = newPlayFilter;
            } else {
                newPlayFilter = positionPlayFilter;
                newPlayFilter.push(leaderBoardSpec);
                positionPlayFilter = newPlayFilter;
            }
            positionLB = leaderBoardSpec;
            if(leaderBoardSpec == 'DEF') {
                leaderboardHeading = 'Defense';
            } else if(leaderBoardSpec == 'QB') {
                leaderboardHeading = 'Quarterback';
            } else if(leaderBoardSpec == 'RB') {
                leaderboardHeading = 'Running Back';
            } else if(leaderBoardSpec == 'WR') {
                leaderboardHeading = 'Wide Receiver';
            } else if(leaderBoardSpec == 'TE') {
                leaderboardHeading = 'Tight End';
            } else if(leaderBoardSpec == 'K') {
                leaderboardHeading = 'Kicker';
            } else if(leaderBoardSpec == 'DB') {
                leaderboardHeading = 'Defensive Back';
            } else if(leaderBoardSpec == 'DL') {
                leaderboardHeading = 'Defensive Lineman';
            } else if(leaderBoardSpec == 'LB') {
                leaderboardHeading = 'Linebacker';
            } else if(leaderBoardSpec == 'FLEX') {
                leaderboardHeading = 'FLEX';
            } else if(leaderBoardSpec == 'SUPER_FLEX') {
                leaderboardHeading = 'Super FLEX';
            } else if(leaderBoardSpec == 'WRRB_FLEX') {
                leaderboardHeading = 'WR/RB FLEX';
            } else if(leaderBoardSpec == 'REC_FLEX') {
                leaderboardHeading = 'WR/TE FLEX';
            } else if(leaderBoardSpec == 'IDP_FLEX') {
                leaderboardHeading = 'IDP FLEX';
            }
            if(positionPlayFilter.length > 0) {
                leaderBoardSpec = positionPlayFilter;
            } else {
                leaderBoardSpec = nflPositions;
            }
        } else if(leaderBoardType == 'matchup') {
            let newMatch = displayMatch(leaderBoardSpec);
            positionLB = newMatch.matchStarters;
            leaderboardHeading = `${managerInfo[newMatch.home.matchInfo.recordManID].abbreviation} v ${managerInfo[newMatch.away.matchInfo.recordManID].abbreviation}`;
            positionPlayFilter = [];
        } else if(leaderBoardType == 'nflGame') {
            let newGameStarters = findStarters(leaderBoardSpec);
            freshGame = true;
            positionLB = newGameStarters;
            leaderboardHeading = `${leaderBoardSpec.home.sleeperID} v ${leaderBoardSpec.away.sleeperID}`;
            positionPlayFilter = [];
        }
        leaderBoardInfo = {
            type: leaderBoardType,
            spec: leaderBoardSpec,
        }
        return leaderBoardInfo;
    }

    $: leaderBoardInfo = changeLeaderBoard(leaderBoardType, leaderBoardSpec);

</script>

<style>
    .bigBox {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        flex-wrap: wrap;
        z-index: auto;
        margin: 0.2em 0.2em 0.8em 0.2em;
        width: 100%;
        height: 45em;
		background-color: #222;
        border-radius: 1em;
        padding: 1%;
        align-content: center;
        align-self: center;
        align-items: center;
        justify-content: center;
        justify-items: center;
    }

    .fptsContainer {
        position: relative;
        display: inline-flex;
        height: 100%;
        width: 25%;
        align-items: center;
        justify-content: center;
    }

    .fptsBox {
        position: relative;
        display: inline-flex;
        border-radius: 1em;
        height: 70%;
        width: 70%;
        border: 0.25px solid #777;
        justify-content: center;
        align-items: center;
        font-size: 1.2em;
        font-weight: 600;
        color: #ededed;
    }

    .statsContainer {
        position: relative;
        display: inline-flex;
        flex-wrap: wrap;
        flex-direction: column;
        justify-content: space-around;
        align-content: flex-start;
        color: #ededed;
        font-size: 0.82em;
        font-weight: 420;
        height: 100%;
        width: 71%;
        margin: 0 4% 0 0;
        overflow: hidden;
    }

    .statWrap {
        position: relative;
        display: inline-flex;
        flex-direction: row;
        line-height: 1.2em;
        align-items: center;
        width: 100%;
        margin: 0 4%;
        justify-content: center;
    }

    .statCat {
        position: relative;
        display: inline-flex;
        color: #ededed;
        justify-content: flex-start;
        width: 50%;
    }

    .statMetric {
        position: relative;
        display: inline-flex;
        color: #ededed;
        width: 25%;
        justify-content: center;
    }

    .statFpts {
        position: relative;
        display: inline-flex;
        color: #ededed;
        width: 25%;
        justify-content: center;
    }

    .viewPlayer {
        position: relative;
        display: inline-flex;
        width: 90%;
        height: 24%;
        border-radius: 1em;
        background-color: var(--f3f3f3);
        padding: 2%;
        margin: 0 0 1% 0;
    }

    .viewPlayerBlock {
        position: relative;
        display: inline-flex;
        align-items: center;
        flex-direction: column;
        width: 100%;
        height: 100%;
        align-content: center;
        justify-content: center;
    }

    .viewPlayerTop {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 39%;
        margin: 0 0 1% 0;
    }

    .viewPlayerBottom {
        position: relative;
        display: inline-flex;
        width: 100%;
        height: 59%;
        margin: 1% 0 0 0;
        align-items: center;
        justify-content: center;
    }

    .viewPlayerProfile {
        position: relative;
        display: inline-flex;
        height: 100%;
        width: 80%;
    }

    .viewPlayerInfo {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        width: 20%;
    }

    .viewPlayerName {
        position: relative;
        display: inline-flex;
        top: 0.4em;
        font-size: 1.2em;
        width: 9em;
        justify-content: flex-start;
        color: #ededed;
    }

    .viewPlayerAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: auto;
        justify-content: center;
        height: 100%;
    }

    .viewDefenseAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: auto;
        justify-content: center;
        height: 100%;
        margin: 0 1.04em;
        top: 0.2em;
    }

    .posPlayerRank {
        position: relative;
        display: inline-flex;
        color: #ededed;
        align-items: center;
        font-weight: 420;
        width: 3%;
        margin: 0 0 0 1%;
        justify-content: center;
    }

    .posPlayerProfile {
        position: relative;
        display: inline-flex;
        height: 100%;
        width: 48%;
        margin: 0 1%;
        flex-direction: row;
        align-items: center;
    }

    .posPlayerManager {
        position: relative;
        display: inline-flex;
        color: #ededed;
        align-items: center;
        font-style: italic;
        font-size: 0.7em;
        overflow: hidden;
        width: 33%;
        margin: 0 1%;
        justify-content: center;
    }

    .posPlayerFpts {
        position: relative;
        display: inline-flex;
        color: #ededed;
        align-items: center;
        width: 8%;
        font-size: 0.85em;
        font-weight: 500;
        margin: 0 1%;
        justify-content: center;
    }

    .posPlayerName {
        position: relative;
        display: inline-flex;
        font-size: 0.85em;
        font-weight: 500;
        width: 72%;
        height: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
        align-items: center;
        color: #ededed;
    }

    .posPlayerAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: auto;
        height: 100%;
        justify-content: center;
    }

    .posPlayerAvatarHolder {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 22%;
        margin: 0 4% 0 2%;
        height: 100%;
        justify-content: center;
    }

    .posDefenseAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: auto;
        justify-content: center;
        height: 100%;
    }

    .leaderboardPOS {
        display: inline-flex;
        flex-direction: column;
        position: relative;
        height: 70%;
        width: 95%;
        margin: 1% 0 0 1%;
        border-radius: 1em;
        padding: 2%;
        background-color: var(--f3f3f3);
        align-content: center;
        justify-content: center;
        align-self: center
    }

    .leaderboardContainer {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        height: 93%;
        margin: 1% 0 0 0;
    }

    .leaderboardRow {
        position: relative;
        display: inline-flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        border: 0.25px solid #343434;
        border-radius: 1em;
        width: 100%;
        height: 8.25%;
        margin: 0.7% 0;
    }

    .bigBoxRightWrap {
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        width: 50%;
        height: 100%;
        align-items: center;
    }

    .bigBoxLeftWrap {
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        width: 50%;
        height: 100%;
        align-items: center;
    }

    .gameManagers {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        width: 99%;
        margin: 0 1% 0 0;
        height: 100%;
        border-radius: 1em;
        background-color: var(--f3f3f3);
        align-self: center;
    }

    .managerBlock {
        position: relative;
        display: inline-flex;
        align-items: flex-start;
        flex-direction: column;
    }

    .managerInfo {
        position: relative;
        display: inline-flex;
        align-items: center;
        height: 0.4em;
    }

    .managerName {
        position: relative;
        display: inline-flex;
        font-style: italic;
    }

    .managerAvatar {
        width: 2.4em;
        height: fit-content;
        margin: 0 1em 0 0;
        border: 0.25px solid #777;
        border-radius: 50%;
    }

    :global(.managerAvatar:hover) {
        cursor: pointer;
        background-color: #181818;
        border: 0.5px solid #ededed;
    }

    .managerStarters {
        display: inline-flex;
        position: relative;
        align-items: center;
        left: 3em;
        top: 1em;
        height: 2.5em;
    }

    .playerAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: auto;
        margin: 0 0.1em;
        justify-content: center;
        height: 100%;
        border: 0.25px solid #777;
        border-radius: 1em;
        padding: 0.175em;
    }

    .playerAvatar:hover {
        cursor: pointer;
        background-color: #181818;
        border: 0.5px solid #ededed;
    }

    .defenseAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: auto;
        margin: 0 0.1em;
        justify-content: center;
        height: 100%;
        border: 0.25px solid #777;
        border-radius: 1em;
        padding: 0.175em;
    }

    .defenseAvatar:hover {
        cursor: pointer;
        background-color: #181818;
        border: 0.5px solid #ededed;
    }

    .heading {
        position: relative;
        display: inline-flex;
        color: #ededed;
        font-weight: 430;
        font-size: 1.4em;
        height: 6%;
        justify-content: center;
        align-items: center;
    }
    .gameHeaderBox {
        display: inline-flex;
        position: absolute;
        z-index: 1;
        width: 96%;
        height: 104%;
        border: 0.25px solid #555;
        border-radius: 1em;
        top: 8%;
    }

    .gameHeaderBox:hover {
        cursor: pointer;
        border: 0.5px solid #ededed;
        border-radius: 1em;
    }

    .gameHeader {
        display: inline-flex;
        flex-direction: row;
        position: relative;
        width: 96%;
        height: 10%;
        padding: 2%;
        justify-content: space-around;
    }

    .gameOpponent {
        display: inline-flex;
        flex-direction: row;
        position: relative;
        height: 100%;
        width: 47.5%;
        align-items: center;
        justify-content: center;
    }

    .matchOpponent {
        display: inline-flex;
        flex-direction: column;
        position: relative;
        height: 100%;
        width: 48.5%;
        justify-content: center;
    }

    .matchTop {
        display: inline-flex;
        flex-direction: row;
        position: relative;
        height: 75%;
        width: 100%;
        align-items: center;
        justify-content: center;
    }

    .versus {
        display: inline-flex;
        position: relative;
        height: 128%;
        width: 3%;
        justify-content: center;
        font-style: italic;
        font-weight: 420;
        font-size: 0.8em;
        color: #999;
        align-items: center;
    }

    .gameTeamWrapper {
        display: inline-flex;
        flex-direction: column;
        position: relative;
        height: 100%;
        margin: 0 2.5%;
        justify-content: center;
    }

    .gameTeam {
        display: inline-flex;
        flex-direction: row;
        position: relative;
        height: 100%;
        color: #ededed;
        font-weight: 700;
    }

    .gameAvatar {
        display: inline-flex;
        flex-direction: row;
        position: relative;
        height: 100%;
        width: auto;
    }

    .matchContainer {
        position: relative;
        display: inline-flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: flex-start;
        height: 86%;
        padding: 2%;
        top: -2%;
    }

    .gameContainer {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: flex-start;
        height: 86%;
        padding: 2%;
    }

    .pos {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5em;
        width: 40%;
		height: 40%;
        position: relative;
	}

    .t {
        display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5em;
        width: 40%;
		height: auto;
        position: relative;
    }

    .QB {
		background-color: var(--QB);
	}

	.WR {
		background-color: var(--WR);
	}

	.RB {
		background-color: var(--RB);
	}

	.TE {
		background-color: var(--TE);
	}

	.FLEX {
		background: linear-gradient(to right, var(--WR), var(--WR) 33.33%, var(--RB) 33.33%, var(--RB) 66.66%, var(--TE) 66.66%);
	}

	.WRRB_FLEX {
		background: linear-gradient(to right, var(--WR), var(--WR) 50%, var(--RB) 50%);
	}

    .REC_FLEX {
		background: linear-gradient(to right, var(--WR), var(--WR) 50%, var(--TE) 50%);
	}

    .SUPER_FLEX {
		background: conic-gradient(var(--RB) 0deg, var(--RB) 90deg, var(--QB) 90deg, var(--QB) 180deg, var(--TE) 180deg, var(--TE) 270deg, var(--WR) 270deg, var(--WR) 360deg);
	}

	.K {
		background-color: var(--K);
	}

	.DEF {
		background-color: var(--DEF);
	}

    .DL, .DE, .DT {
        background-color: var(--DL);
    }

    .LB {
        background-color: var(--LB);
    }

    .DB, .CB, .SS, .FS {
        background-color: var(--DB);
    }

    .IDP_FLEX {
        background: #000000;
    }

    .rosterWrap {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        height: 100%;
        width: 44%;
        justify-content: space-evenly;
        align-items: center;
    }

    .rosterPlayerInfo {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        font-size: 0.85em;
        font-weight: 500;
        color: #ededed;
    }

    .rosterPlayer {
        position: relative;
        display: inline-flex;
        flex-direction: row;
        height: 50%;
        width: 100%;
        align-items: center;
        line-height: 0.5em;
    }

    .rosterAvatar {
        position: relative;
        display: inline-flex;
        flex-direction: row;
        height: 100%;
        width: auto;
        align-items: center;
    }

    .rosterAvatar:hover {
        cursor: pointer;
        background-color: #181818;
        border: 0.5px solid #ededed;
        border-radius: 1em;
    }

    .rosterRow {
        position: relative;
        display: inline-flex;
        align-items: center;
        flex-direction: row;
        height: 8%;
        width: 100%;
    }

    .positionGroup {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        width: 44%;
        height: 100%;
    }
    
    .avatarHolder {
        position: relative;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        height: 100%;
        width: 35%;
    }

    .positionsWrap {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        height: 100%;
        width: 12%;
        justify-content: space-evenly;
        align-items: center;
    }

    .rosterPosition {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 8%;
        width: 100%;
        border-radius: 25%;
        font-weight: 900;
    }

    .selectedPosition {
        position: absolute;
        display: inline-flex;
        height: 100%;
        width: 100%;
        border-radius: 25%;
    }

    .selectedPosition:hover {
        cursor: pointer;
        border: 0.5px solid #ededed;
        z-index: 1;
    }

    .rosterRowBox {
    	position: absolute;
        display: inline-flex;
        align-items: center;
        flex-direction: column;
        height: 100%;
        width: 835%;
        border: 0.25px solid #555;
        border-radius: 1em;
    }

    .totalPointsRow {
        position: relative;
        display: inline-flex;
        justify-content: space-around;
        flex-direction: row;
        width: 100%;
        height: 100%;
        top: -3.5%;
    }

    .totalPointsWrap {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        width: 25%;
        height: 145%;
        border: 0.25px solid #777;
        border-radius: 0.9em;
        align-items: center;
        justify-content: center;
        line-height: 1em;
    }

    .projectedPoints {
        position: relative;
        display: inline-flex;
        font-weight: 420;
        font-size: 0.85em;
        color: #999;
        top: 15%;
    }

    .totalPoints {
        position: relative;
        display: inline-flex;
        font-weight: 600;
        font-size: 1.2em;
        color: #ededed;
        top: 5%;
    }

    .gameRow {
        position: relative;
        display: inline-flex;
        width: 100%;
        align-items: center;
    }
</style>

<div class="bigBox">
    <div class="bigBoxLeftWrap">
        <div class="gameManagers">
            <!-- shows specific NFL games -->
            {#if showGameBox == true}
                <div class="gameHeader">
                    <div class="gameHeaderBox" style="{showGameBox == true ? "border: 0.5px solid #ededed; border-radius: 1em;" : null}" on:click={() => multiFunction(null, null, 'nflGame', game)} />
                    <div class="gameOpponent">
                        <img class="gameAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{game.home.sleeperID.toLowerCase()}.png" alt="{game.home.sleeperID}">
                        <div class="gameTeamWrapper" style="align-items: flex-start;">
                            <div class="gameTeam" style="align-items: flex-end;">{game.home.fn}</div>
                            <div class="gameTeam" style="align-items: flex-start;">{game.home.ln}</div>
                        </div>
                    </div>
                    <div class="versus">V</div>
                    <div class="gameOpponent">
                        <div class="gameTeamWrapper" style="align-items: flex-end;">
                            <div class="gameTeam" style="align-items: flex-end;">{game.away.fn}</div>
                            <div class="gameTeam" style="align-items: flex-start;">{game.away.ln}</div>
                        </div>
                        <img class="gameAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{game.away.sleeperID.toLowerCase()}.png" alt="{game.away.sleeperID}">
                    </div>
                </div>
                <div class="gameContainer">
                    {#each positionGameStarters.rowHeights[gameSelection] as row, ix}
                        {#if row != 0}
                            <div class="gameRow" style="height: {8 * row}%">
                                <div class="positionGroup">
                                    {#each positionGameStarters[game.home.sleeperID].starters[ix] as starter}
                                        <div class="rosterRow" style="justify-content: flex-start; height: {100 / row}%">
                                            <div class="avatarHolder">
                                                <img class="rosterAvatar" src="{starter.avatar}" alt="" on:click={() => multiFunction(starter.playerID, starter.t, null, null)} style="z-index: 1; {viewPlayer?.playerID == starter.playerID ? "background-color: #181818; border: 0.5px solid #ededed; border-radius: 1em;" : null}">
                                            </div>
                                            <div class="rosterPlayerInfo">
                                                <div class="rosterPlayer" style="justify-content: flex-start; {starter.pos == 'DEF' ? "width: 82%; margin: 0 3% 0 15%;" : "width: 92%; margin: 0 3% 0 5%;"}">{starter.fn.slice(0, 1)}. {starter.ln}</div>
                                                <div class="rosterPlayer" style="justify-content: flex-start; color: #999; font-size: 0.75em; {starter.pos == 'DEF' ? "width: 82%; margin: 0 3% 0 15%;" : "width: 92%; margin: 0 3% 0 5%; line-height: 1em;"}">{starter.owner.name}</div>
                                                <div class="rosterPlayer" style="justify-content: space-between; {starter.pos == 'DEF' ? "width: 82%; margin: 0 3% 0 15%;" : "width: 92%; margin: 0 3% 0 5%;"}">
                                                    <div style="display: inline-flex; font-weight: 600;">{round(starter.fpts)}</div>
                                                    <div style="display: inline-flex; color: #999; justify-content: flex-end; margin: 0 5% 0 0;">({starter.projection})</div>
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                                <div class="positionsWrap" style="justify-content: flex-start;">
                                    <div class="rosterPosition {nflPositions[ix]}" style="height: {100 / row}%;">
                                        <div class="rosterRowBox" style="top: -2%; height: {100 * row}%; {positionPlayFilter.length > 0 && positionPlayFilter.includes(nflPositions[ix]) ? "border: 0.5px solid #ededed; border-radius: 1em;" : null}"></div>
                                        {nflPositions[ix]}
                                        <div class="selectedPosition" id="selectedPosition" on:click={() => multiFunction(null, null, 'position', nflPositions[ix])} style="{positionPlayFilter.length > 0 && positionPlayFilter.includes(nflPositions[ix]) ? "border: 0.5px solid #ededed; border-radius: 1em; z-index: 1;" : null}"></div>
                                    </div>
                                </div>
                                <div class="positionGroup">
                                    {#each positionGameStarters[game.away.sleeperID].starters[ix] as starter}
                                        <div class="rosterRow" style="justify-content: flex-end; height: {100 / row}%;">
                                            <div class="rosterPlayerInfo">
                                                <div class="rosterPlayer" style="justify-content: flex-end; {starter.pos == 'DEF' ? "width: 82%; margin: 0 15% 0 3%;" : "width: 92%; margin: 0 15% 0 3%;"}">{starter.fn.slice(0, 1)}. {starter.ln}</div>
                                                <div class="rosterPlayer" style="justify-content: flex-end; color: #999; font-size: 0.75em; {starter.pos == 'DEF' ? "width: 82%; margin: 0 15% 0 3%;" : "width: 92%; margin: 0 15% 0 3%; line-height: 1em;"}">{starter.owner.name}</div>
                                                <div class="rosterPlayer" style="justify-content: space-between; {starter.pos == 'DEF' ? "width: 82%; margin: 0 15% 0 3%;" : "width: 92%; margin: 0 15% 0 3%;"}">
                                                    <div style="display: inline-flex; color: #999; justify-content: flex-start; margin: 0 0 0 5%;">({starter.projection})</div>  
                                                    <div style="display: inline-flex; font-weight: 600;">{round(starter.fpts)}</div>
                                                </div>
                                            </div>                                
                                            <div class="avatarHolder">
                                                <img class="rosterAvatar" src="{starter.avatar}" alt="" on:click={() => multiFunction(starter.playerID, starter.t, null, null)} style="{viewPlayer?.playerID == starter.playerID ? "background-color: #181818; border: 0.5px solid #ededed; border-radius: 1em;" : null}">
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
<!--
                <div class="gameContainer">
                    {#each gameManagers as manager}
                        <div class="managerBlock">
                            <div class="managerInfo">
                                <img class="managerAvatar" src="{manager.info.avatar}" alt="">
                                <div class="managerName">{manager.info.name}</div>
                            </div>
                            <div class="managerStarters">
                                {#each manager.starters as starter}
                                    {#if starter.playerID == game.home.sleeperID || starter.playerID == game.away.sleeperID}
                                        <img class="defenseAvatar" src="{starter.avatar}" alt="" on:click={() => changePlayer(starter.playerID)} style="{viewPlayer?.playerID == starter.playerID ? "background-color: #181818; border: 0.5px solid #ededed;" : null}">
                                    {:else}
                                        <img class="playerAvatar" src="{starter.avatar}" alt="" on:click={() => changePlayer(starter.playerID)} style="{viewPlayer?.playerID == starter.playerID ? "background-color: #181818; border: 0.5px solid #ededed;" : null}">
                                    {/if}
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div> -->
                <!-- shows league matchups -->
            {:else if showMatchBox == true}        
                <div class="gameHeader">
                    <div class="gameHeaderBox" style="height: 120%; {showMatchBox == true ? "border: 0.5px solid #ededed; border-radius: 1em;" : null}" on:click={() => multiFunction(null, null, 'matchup', match.home.matchInfo.matchID)} />
                    <div class="matchOpponent">
                        <div class="matchTop" style="justify-content: flex-start; left: 2%; top: 8%;">
                            <img class="gameAvatar" src="{match.home.manager.avatar}" alt="" style="border: 1px solid #777; border-radius: 50%; height: 90%; width: auto;">
                            <div class="gameTeamWrapper">
                                <div class="gameTeam" style="margin: 0 0 5% 0; left: -2%;">{match.home.manager.realname}</div>
                            </div>
                        </div>
                        <div class="gameTeam" style="align-items: center; font-size: 0.75em; font-style: italic; color: #999; top: -40%; left: 30%; width: 69%; line-height: 1em;">{match.home.manager.name}</div>
                        <div class="gameTeam" style="align-items: center; font-size: 0.75em; font-style: italic; color: #999; top: -40%; left: 30%; width: 69%; line-height: 1em;">{match.home.record.showTies == true ? '(' + match.home.record.wins + ' - ' + match.home.record.ties + ' - ' + match.home.record.losses + ')' : '(' + match.home.record.wins + ' - ' + match.home.record.losses + ')'}</div>
                    </div>
                    <div class="versus">V</div>
                    <div class="matchOpponent">
                        <div class="matchTop" style="justify-content: flex-end; right: 2%; top: 8%;">
                            <div class="gameTeamWrapper">
                                <div class="gameTeam" style="margin: 0 0 5% 0; right: -2%;">{match.away.manager.realname}</div>
                            </div>
                            <img class="gameAvatar" src="{match.away.manager.avatar}" alt="" style="border: 1px solid #777; border-radius: 50%; height: 90%; width: auto;">
                        </div>
                        <div class="gameTeam" style="align-items: center; justify-content: flex-end; font-size: 0.75em; font-style: italic; color: #999; top: -40%; width: 69%; line-height: 1em;">{match.away.manager.name}</div>
                        <div class="gameTeam" style="align-items: center; justify-content: flex-end; font-size: 0.75em; font-style: italic; color: #999; top: -40%; width: 69%; line-height: 1em;">{match.away.record.showTies == true ? '(' + match.away.record.wins + ' - ' + match.away.record.ties + ' - ' + match.away.record.losses + ')' : '(' + match.away.record.wins + ' - ' + match.away.record.losses + ')'}</div>
                    </div>
                </div>
                <div class="totalPointsRow">
                    <div class="totalPointsWrap">
                        <div class="totalPoints">{round(match.home.fpts)}</div>
                        <div class="projectedPoints">{round(match.home.projection)}</div>
                    </div>
                    <div class="totalPointsWrap">
                        <div class="totalPoints">{round(match.away.fpts)}</div>
                        <div class="projectedPoints">{round(match.away.projection)}</div>
                    </div>
                </div>
                <div class="matchContainer">
                    <div class="rosterWrap">
                        {#each match.home.starters as starter}
                            <div class="rosterRow" style="justify-content: flex-start;">
                                <div class="avatarHolder">
                                    <img class="rosterAvatar" src="{starter.avatar}" alt="" on:click={() => multiFunction(starter.playerID, starter.t, null, null)} style="z-index: 1; {viewPlayer?.playerID == starter.playerID ? "background-color: #181818; border: 0.5px solid #ededed; border-radius: 1em;" : null}">
                                </div>
                                <div class="rosterPlayerInfo">
                                    <div class="rosterPlayer" style="justify-content: flex-start; {starter.pos == 'DEF' ? "width: 82%; margin: 0 3% 0 15%;" : "width: 92%; margin: 0 3% 0 5%;"}">{starter.fn.slice(0, 1)}. {starter.ln}</div>
                                    <div class="rosterPlayer" style="justify-content: space-between; {starter.pos == 'DEF' ? "width: 82%; margin: 0 3% 0 15%;" : "width: 92%; margin: 0 3% 0 5%;"}">
                                        <div style="display: inline-flex; font-weight: 600;">{round(starter.fpts)}</div>
                                        <div style="display: inline-flex; color: #999; justify-content: flex-end; margin: 0 5% 0 0;">({round(starter.projection)})</div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                    <div class="positionsWrap">
                        {#each positions as position}
                            <div class="rosterPosition {position}">
                                <div class="rosterRowBox" style="{positionPlayFilter.length > 0 && positionPlayFilter.includes(position)  ? "border: 0.5px solid #ededed; border-radius: 1em;" : null}" />
                                {position}
                                <div class="selectedPosition" on:click={() => multiFunction(null, null, 'position', position)} style="{positionPlayFilter.length > 0 && positionPlayFilter.includes(position) ? "border: 0.5px solid #ededed; border-radius: 1em; z-index: 1;" : null}"></div>
                            </div>
                        {/each}
                    </div>
                    <div class="rosterWrap">
                        {#each match.away.starters as starter}
                            <div class="rosterRow" style="justify-content: flex-end;">
                                <div class="rosterPlayerInfo">
                                    <div class="rosterPlayer" style="justify-content: flex-end; {starter.pos == 'DEF' ? "width: 82%; margin: 0 15% 0 3%;" : "width: 92%; margin: 0 15% 0 3%;"}">{starter.fn.slice(0, 1)}. {starter.ln}</div>
                                    <div class="rosterPlayer" style="justify-content: space-between; {starter.pos == 'DEF' ? "width: 82%; margin: 0 15% 0 3%;" : "width: 92%; margin: 0 15% 0 3%;"}">
                                        <div style="display: inline-flex; color: #999; justify-content: flex-start; margin: 0 0 0 5%;">({round(starter.projection)})</div>  
                                        <div style="display: inline-flex; font-weight: 600;">{round(starter.fpts)}</div>
                                    </div>
                                </div>                                
                                <div class="avatarHolder">
                                    <img class="rosterAvatar" src="{starter.avatar}" alt="" on:click={() => multiFunction(starter.playerID, starter.t, null, null)} style="{viewPlayer?.playerID == starter.playerID ? "background-color: #181818; border: 0.5px solid #ededed; border-radius: 1em;" : null}">
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>
    <div class="bigBoxRightWrap">
        <div class="viewPlayer">
            <div class="viewPlayerBlock">
                <div class="viewPlayerTop">
                    <div class="viewPlayerProfile">
                        {#if viewPlayer?.pos != 'DEF'}
                            <img class="viewPlayerAvatar" src="{viewPlayer?.avatar}" alt="">
                            <div class="viewPlayerName">{viewPlayer?.fn || ''} {viewPlayer?.ln || ''}</div>
                        {:else}
                            <img class="viewDefenseAvatar" src="{viewPlayer?.avatar}" alt="">
                            <div class="viewPlayerName">{viewPlayer?.ln + ' Defense' || ''}</div>  
                        {/if}
                    </div>
                    <div class="viewPlayerInfo">
                        <img class="t" src="{viewPlayer?.teamAvatar || ''}" alt="">
                        <div class="pos {viewPlayer?.pos}">{viewPlayer?.pos || ''}</div>
                    </div>
                </div>
                {#if viewPlayer}
                    <div class="viewPlayerBottom">                       
                        {#await displayStats}
                            {''}
                        {:then displayStats} 
                            {#if displayStats}
                                {#each displayStats as player}
                                    <div class="fptsContainer">
                                        <div class="fptsBox">{round(player.totalFpts)}</div>
                                    </div>
                                    <div class="statsContainer">
                                        {#each player.stats as statCat}  
                                            <div class="statWrap" style="{viewPlayer.teamColor}">
                                                <div class="statCat">{statCat.statDesc}</div>
                                                <div class="statMetric" style="{viewPlayer.teamAltColor}">{statCat.metric}</div>
                                                <div class="statFpts">{round(statCat.fpts)}</div>
                                            </div>
                                        {/each}
                                    </div>
                                {/each}
                            {:else}
                                No points yet...
                            {/if}
                        {/await}         
                    </div>
                {/if}
            </div>
        </div>
        <div class="leaderboardPOS">
            <div class="heading">
                {leaderboardHeading} Leaderboard
            </div>
            <div class="leaderboardContainer">
                {#if positionLeaderboard && positionLeaderboard.length > 0}
                    {#each positionLeaderboard as positionLeader, ix}
                        <div class="leaderboardRow" style="{positionLeader.playerID == viewPlayer?.playerID ? "background-color: #181818; border: 0.5px solid #ededed; font-weight: 700;" : null}">
                            <div class="posPlayerRank">{ix + 1}</div>
                            <div class="posPlayerProfile">
                                {#if positionLeader.pos == 'DEF'}
                                    <div class="posPlayerAvatarHolder">
                                        <img class="posDefenseAvatar" src="{positionLeader.avatar}" alt="">
                                    </div>
                                    <div class="posPlayerName">{positionLeader.ln + ' DEF' || ''}</div> 
                                {:else}
                                    <div class="posPlayerAvatarHolder">
                                        <img class="posPlayerAvatar" src="{positionLeader.avatar}" alt="">
                                    </div>
                                    <div class="posPlayerName">{positionLeader.fn || ''} {positionLeader.ln || ''}</div> 
                                {/if}
                            </div>
                            <div class="posPlayerManager">{positionLeader.owner.name}</div>
                            <div class="posPlayerFpts">{round(positionLeader.fpts)}</div>
                        </div>
                    {/each}
                {:else}
                    No leaderboard yet...
                {/if}
            </div>
        </div>
    </div>
</div>