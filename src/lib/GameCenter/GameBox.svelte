<script>
    import {round} from '$lib/utils/helper'; 

    export let nflTeams, nflMatchups, leagueData, playersInfo, fantasyStarters, managerInfo, fantasyProducts, gameSelection;
    
    const score = leagueData.scoring_settings;

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
        let recordedStats = [];
        let displayStats = [];
        if(newFantasyProducts.length > 0 && viewPlayer != null) {
            for(const products of newFantasyProducts) {
                for(const play of products) {
                    if(play.playerInfo.playerID == viewPlayer.playerID) {
                        if(!viewPlayerStats[viewPlayer.playerID]) {
                            viewPlayerStats[viewPlayer.playerID] = {
                                fpts: play.fpts,
                                stats: [],
                                statInfo: {},
                            }
                        } else {
                            viewPlayerStats[viewPlayer.playerID].fpts += play.fpts;
                        }
                        for(const stat of play.stat) {
                            if(!recordedStats.includes(stat)) {
                                recordedStats.push(stat);
                                viewPlayerStats[viewPlayer.playerID].statInfo[stat] = {
                                    stat,
                                    occurs: 1,
                                    fpts: play.fpts,
                                }
                            } else {
                                viewPlayerStats[viewPlayer.playerID].statInfo[stat].occurs ++;
                                viewPlayerStats[viewPlayer.playerID].statInfo[stat].fpts += play.fpts;
                            }
                        }
                    }
                }
            }

            if(viewPlayer.pos == 'DEF') {               // TEAM DEF/ST
                for(const stat of recordedStats) {
                    if(!stat.includes('idp') && !stat.includes('pass') && !stat.includes('rush') && !stat.includes('xp') && !stat.includes('fgm')) {
                        if((stat.startsWith('yds_allow') || stat == 'def_kr_yd' || stat == 'def_pr_yd') && !viewPlayerStats[viewPlayer.playerID].stats.includes('Yds Alw:')) {
                            const statCat = 'Yds Alw:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('Yds Alw:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat]; 
                        } else if(stat.startsWith('pts_allow') && !viewPlayerStats[viewPlayer.playerID].stats.includes('Pts Alw:')) {
                            const statCat = 'Pts Alw:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('Pts Alw:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat]; 
                        } else if(stat == 'int' && !viewPlayerStats[viewPlayer.playerID].stats.includes('INT:')) {
                            const statCat = 'INT:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('INTs');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat]; 
                        } else if(stat == 'int_ret_yd' && !viewPlayerStats[viewPlayer.playerID].stats.includes('INT Yds:')) {
                            const statCat = 'INT Yds:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('INT Yds:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if((stat == 'sack' || stat == 'bonus_sack_2p') && !viewPlayerStats[viewPlayer.playerID].stats.includes('Sack:')) {
                            const statCat = 'Sack:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('Sacks:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat == 'sack_yd' && !viewPlayerStats[viewPlayer.playerID].stats.includes('Sack Yds:')) {
                            const statCat = 'Sack Yds:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('Sack Yds:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if((stat == 'ff' || stat == 'def_st_ff') && !viewPlayerStats[viewPlayer.playerID].stats.includes('FF:')) {
                            const statCat = 'FF:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('FF:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat == 'blk_kick' && !viewPlayerStats[viewPlayer.playerID].stats.includes('Blk Kick:')) {
                            const statCat = 'Blk Kick:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('Blk Kick:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat == 'def_pass_def' && !viewPlayerStats[viewPlayer.playerID].stats.includes('Pass D:')) {
                            const statCat = 'Pass D:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('Pass D:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if((stat == 'def_st_fum_rec' || stat == 'fum_rec') && !viewPlayerStats[viewPlayer.playerID].stats.includes('FR:')) {
                            const statCat = 'FR:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('FR:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if((stat == 'def_td' || stat == 'def_st_td' || stat == 'fum_rec_td' || stat.startsWith('def_bonus')) && !viewPlayerStats[viewPlayer.playerID].stats.includes('TD:')) {
                            const statCat = 'TD:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('TD:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat == 'def_forced_punts' && !viewPlayerStats[viewPlayer.playerID].stats.includes('PNT:')) {
                            const statCat = 'PNT:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('PNT:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat == 'def_4_and_stop' && !viewPlayerStats[viewPlayer.playerID].stats.includes('4D:')) {
                            const statCat = '4D:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('4D:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat == 'def_3_and_out' && !viewPlayerStats[viewPlayer.playerID].stats.includes('3&O:')) {
                            const statCat = '3&O:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('3&O:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat == 'safe' && !viewPlayerStats[viewPlayer.playerID].stats.includes('SFTY:')) {
                            const statCat = 'SFTY:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('SFTY:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat == 'def_2pt' && !viewPlayerStats[viewPlayer.playerID].stats.includes('2PTR:')) {
                            const statCat = '2PTR:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('2PTR:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if((stat == 'blk_kick_ret_yd' || stat == 'fg_ret_yd' || stat == 'fum_ret_yd') && !viewPlayerStats[viewPlayer.playerID].stats.includes('Ret Yds:')) {
                            const statCat = 'Ret Yds:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('Ret Yds:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat.includes('tkl') && stat != 'bonus_tkl_10p' && !viewPlayerStats[viewPlayer.playerID].stats.includes('TKL:')) {
                            const statCat = 'TKL:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('TKL:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        } else if(stat == 'qb_hit' && !viewPlayerStats[viewPlayer.playerID].stats.includes('QBH:')) {
                            const statCat = 'QBH:';
                            viewPlayerStats[viewPlayer.playerID].stats.push('QBH:');
                            viewPlayerStats[viewPlayer.playerID].statInfo[statCat] = viewPlayerStats[viewPlayer.playerID].statInfo[stat];
                        }
                    }
                }
            }
            displayStats.push(viewPlayerStats[viewPlayer.playerID]);
        } else {
            displayStats = null;
        }
        return displayStats;
    }
    $: displayStats = getDisplayStats(viewPlayer);
</script>

<style>
    .bigBox {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        flex-wrap: wrap;
        z-index: auto;
        margin: 0.2em 0.2em 0.8em 0.2em;
        width: 99%;
        height: 40em;
		background-color: #222;
        border-radius: 1em;
        padding: 0.5em;
    }

    .fptsContainer {
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
        align-content: space-around;
        align-items: flex-end;
        color: #ededed;
        left: 0.5em;
        font-size: 0.88em;
        font-weight: 420;
    }

    .stat {
        position: relative;
        display: inline-flex;
        color: #ededed;
    }

    .viewPlayer {
        position: relative;
        display: inline-flex;
        width: 35%;
        height: 25%;
        border-radius: 1em;
        background-color: var(--f3f3f3);
        right: -6em;
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
    }

    .viewPlayerBottom {
        position: relative;
        display: inline-flex;
        width: 100%;
        height: 100%;
        align-items: center;
        padding: 0 0.8em;
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

    .gameManagers {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        width: auto;
        height: 100%;
        border-radius: 1em;
        background-color: var(--f3f3f3);
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
                                <div class="fptsContainer">{round(player.fpts)}</div>
                                <div class="statsContainer">
                                    {#each player.stats as statCat}  
                                        <div class="stat">{statCat} {round(player.statInfo[statCat].fpts)}</div>
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
</div>