<script>
    import {round} from '$lib/utils/helper'; 

    export let nflTeams, nflMatchups, leagueData, playersInfo, fantasyStarters, positionLeaders, managerInfo, fantasyProducts, gameSelection=nflMatchups[0][0].gameID;;
    
    const score = leagueData.scoring_settings;
    let freshGame = new Boolean (false);
    let positionLB;
    let leaderboardHeading = 'Game';

    // create top 10 points-scorers arrays for each position
    const positionRankArrays = {};
    for(const position in positionLeaders) {
        positionRankArrays[position] = positionLeaders[position].slice(0, 10);
    }

    const displayGame = (gameSelection) => {
        let game = nflMatchups.filter(m => m[0].gameID == gameSelection)[0];
        let home = game[0].sleeperID;
        let away = game[1].sleeperID;
        freshGame = true;
        changePlayer('flush');
        return {home, away};
    }
    $: game = displayGame(gameSelection);

    const findStarters = (game) => {
        const gameStarters = {};
        for(const recordManID in fantasyStarters) {
            const starters = fantasyStarters[recordManID].starters;
            for(const starter of starters) {
                const starterInfo = playersInfo.players[starter];
                if(starter != '0' && (starterInfo.t == game.home || starterInfo.t == game.away)) {
                    const starterEntry = {
                        playerID: starter,
                        fpts: fantasyStarters[recordManID].startersPoints[starters.indexOf(starter)],
                        owner: managerInfo[recordManID],
                        recordManID,
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
                    if(!gameStarters[recordManID]) {
                        gameStarters[recordManID] = [];
                    }
                    gameStarters[recordManID].push(starterEntry);
                }
            }
        }
        positionLB = gameStarters;
        leaderboardHeading = `${game.home} v ${game.away}`;
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

    let viewPlayer;
    export const changePlayer = (playerID) => {
        if(playerID == 'flush') {
            viewPlayer = null;
        } else {
            for(const recordManID in gameStarters) {
                if(gameStarters[recordManID].find(s => s.playerID == playerID)) {
                    viewPlayer = gameStarters[recordManID].find(s => s.playerID == playerID);
                }
            }
            positionLB = viewPlayer.pos;
            if(positionLB == 'DEF') {
                leaderboardHeading = 'Defense';
            } else if(positionLB == 'QB') {
                leaderboardHeading = 'Quarterback';
            } else if(positionLB == 'RB') {
                leaderboardHeading = 'Running Back';
            } else if(positionLB == 'WR') {
                leaderboardHeading = 'Wide Receiver';
            } else if(positionLB == 'TE') {
                leaderboardHeading = 'Tight End';
            } else if(positionLB == 'K') {
                leaderboardHeading = 'Kicker';
            } else if(positionLB == 'DB') {
                leaderboardHeading = 'Defensive Back';
            } else if(positionLB == 'DL') {
                leaderboardHeading = 'Defensive Lineman';
            } else if(positionLB == 'LB') {
                leaderboardHeading = 'Linebacker';
            }
        }
        getDisplayStats(viewPlayer);
        return viewPlayer;
    }
    const getDisplayStats = async (viewPlayer) => {
        let newFantasyProducts = await fantasyProducts;
        const viewPlayerStats = {};
        let displayStats = [];
        if(newFantasyProducts.length > 0 && viewPlayer != null) {
            let runningTotals = newFantasyProducts[newFantasyProducts.length - 1];
            viewPlayerStats[viewPlayer.playerID] = {
                stats: [],
                totalFpts: runningTotals[viewPlayer.playerID].totalFpts,
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

    .container {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: flex-start;
        height: 100%;
        padding: 0.75em;
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

	.WRRB {
		background: linear-gradient(to right, var(--WR), var(--WR) 50%, var(--RB) 50%);
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

    .IDP {
        background: linear-gradient(to right, var(--DL), var(--DL) 33.33%, var(--LB) 33.33%, var(--LB) 66.66%, var(--DB) 66.66%);
    }
</style>

<div class="bigBox">
    <div class="bigBoxLeftWrap">
        <div class="gameManagers">
            <div class="heading">Starters</div>
            <div class="container">
                {#each gameManagers as manager}
                    <div class="managerBlock">
                        <div class="managerInfo">
                            <img class="managerAvatar" src="{manager.info.avatar}" alt="">
                            <div class="managerName">{manager.info.name}</div>
                        </div>
                        <div class="managerStarters">
                            {#each manager.starters as starter}
                                {#if starter.playerID == game.home || starter.playerID == game.away}
                                    <img class="defenseAvatar" src="{starter.avatar}" alt="" on:click={() => changePlayer(starter.playerID)} style="{viewPlayer?.playerID == starter.playerID ? "background-color: #181818; border: 0.5px solid #ededed;" : null}">
                                {:else}
                                    <img class="playerAvatar" src="{starter.avatar}" alt="" on:click={() => changePlayer(starter.playerID)} style="{viewPlayer?.playerID == starter.playerID ? "background-color: #181818; border: 0.5px solid #ededed;" : null}">
                                {/if}
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
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