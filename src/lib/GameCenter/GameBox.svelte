<script>
    import AllManagers from '$lib/Managers/AllManagers.svelte';
import {round} from '$lib/utils/helper'; 

    export let nflTeams, nflMatchups, leagueData, playersInfo, fantasyStarters, positionLeaders, managerInfo, fantasyProducts, gameSelection;
    
    const score = leagueData.scoring_settings;
    // create top 10 points-scorers arrays for each position
    const positionRankArrays = {};
    for(const position in positionLeaders) {
        positionRankArrays[position] = positionLeaders[position].slice(0, 10);
    }

    const displayGame = (gameSelection) => {
        let game = nflMatchups.filter(m => m[0].gameID == gameSelection)[0];
        let home = game[0].sleeperID;
        let away = game[1].sleeperID;
        changePlayer('flush');
        return {home, away};
    }
    $: game = displayGame(gameSelection);

    const findStarters = (game) => {
        const gameStarters = {};
        for(const recordManID in fantasyStarters) {
            const starters = fantasyStarters[recordManID];
            for(const starter of starters) {
                const starterInfo = playersInfo.players[starter];
                if(starter != '0' && (starterInfo.t == game.home || starterInfo.t == game.away)) {
                    const starterEntry = {
                        playerID: starter,
                        owner: managerInfo[recordManID],
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
    let positionLB;
    export const changePlayer = (playerID) => {
        if(playerID == 'flush') {
            viewPlayer = null;
        } else {
            for(const recordManID in gameStarters) {
                if(gameStarters[recordManID].find(s => s.playerID == playerID)) {
                    viewPlayer = gameStarters[recordManID].find(s => s.playerID == playerID);
                }
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
            positionLB = runningTotals[viewPlayer.playerID].pos;
        } else {
            displayStats = null;
        }
        return displayStats;
    }
    $: displayStats = getDisplayStats(viewPlayer);

    const getPositionLeaders = (positionLB) => {
        let positionLeaderboard = positionRankArrays[positionLB];
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
        height: 40em;
		background-color: #222;
        border-radius: 1em;
        padding: 0.5em;
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
        height: 64px;
        width: 64px;
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
        width: 75%;
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
        width: 70%;
        height: 30%;
        border-radius: 1em;
        background-color: var(--f3f3f3);
        padding: 0.2em;
    }

    .viewPlayerBlock {
        position: relative;
        display: inline-flex;
        align-items: flex-start;
        flex-direction: column;
        width: 100%;
    }

    .viewPlayerTop {
        position: relative;
        display: inline-flex;
        align-items: flex-start;
        width: 100%;
        height: 40%;
    }

    .viewPlayerBottom {
        position: relative;
        display: inline-flex;
        width: 92%;
        height: 60%;
        align-items: center;
        padding: 0.2em 0.8em;
    }

    .viewPlayerProfile {
        position: relative;
        display: inline-flex;
        height: 64px;
    }

    .viewPlayerInfo {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 64px;
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

    .posPlayerName {
        position: relative;
        display: inline-flex;
        top: 0.4em;
        font-size: 1.2em;
        width: 9em;
        justify-content: flex-start;
        color: #ededed;
    }

    .posPlayerAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 55px;
        height: fit-content;
        justify-content: center;
    }

    .posDefenseAvatar {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 45px;
        justify-content: center;
        height: fit-content;
        margin: 0 1.04em;
        top: 0.2em;
    }

    .leaderboardPOS {
        display: inline-flex;
        flex-direction: column;
        position: relative;
        height: 70%;
        width: 100%;
        border-radius: 1em;
        background-color: var(--f3f3f3);
        align-content: center;
        justify-content: center;
        align-self: center
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
        width: 100%;
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

    :global(.playerAvatar:hover) {
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

    :global(.defenseAvatar:hover) {
        cursor: pointer;
        background-color: #181818;
        border: 0.5px solid #ededed;
    }

    .leaderboardRow {
        position: relative;
        display: inline-flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
    }

    .heading {
        position: relative;
        display: inline-flex;
        color: #ededed;
        font-weight: 430;
        font-size: 1.4em;
        margin: 0.2em;
        justify-content: center;
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
		border-radius: 8px;
        max-width: 30px;
        min-width: 30px;
		height: 30px;
        position: relative;
        top: 0.2em;
	}

    .t {
        display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
        max-width: 30px;
        min-width: 30px;
		height: 30px;
        position: relative;
        top: 0.2em;
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
                Leaderboard
            </div>
            <div class="container">
                {#if positionLeaderboard && positionLeaderboard.length > 0}
                    {#each positionLeaderboard as positionLeader}
                        <div class="leaderboardRow">
                            {#if positionLB != 'DEF'}
                                <img class="posPlayerAvatar" src="{positionLeader.avatar}" alt="">
                                <div class="posPlayerName">{positionLeader.playerInfo.fn || ''} {positionLeader.playerInfo.ln || ''}</div>
                            {:else}
                                <img class="posDefenseAvatar" src="{positionLeader.avatar}" alt="">
                                <div class="posPlayerName">{positionLeader.playerInfo.ln + ' Defense' || ''}</div>  
                            {/if}
                            {round(positionLeader.fpts)}
                        </div>
                    {/each}
                {:else}
                    No leaders yet...
                {/if}
            </div>
        </div>
    </div>
</div>