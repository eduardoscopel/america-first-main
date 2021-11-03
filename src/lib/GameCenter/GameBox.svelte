<script>
    export let nflTeams, nflMatchups, playersInfo, fantasyStarters, managerInfo, gameSelection;

    const displayGame = (gameSelection) => {
        let game = nflMatchups.filter(m => m[0].gameID == gameSelection)[0];
        let home = game[0].sleeperID;
        let away = game[1].sleeperID;
        return {home, away};
    }
    $: game = displayGame(gameSelection);

    const displayManagers = (game) => {
        let gameManagers = [];
        const gameManager = {};
        // let game = nflMatchups.filter(m => m[0].gameID == gameSelection)[0];
        // let home = game[0].sleeperID;
        // let away = game[1].sleeperID;

        for(const recordManID in fantasyStarters) {
            const starters = fantasyStarters[recordManID];
            let gameStarters = [];
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
                    }
                    gameStarters.push(starterEntry);
                }
            }
            if(gameStarters.length > 0) {
                if(!gameManager[recordManID]){
                    gameManager[recordManID] = {
                        info: managerInfo[recordManID],
                        starters: gameStarters,
                    }
                }
                gameManagers.push(gameManager[recordManID]);
            }
        }
        return gameManagers;
    }
    $: gameManagers = displayManagers(game);

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

    .viewPlayer {
        position: relative;
        display: inline-flex;
        width: 35%;
        height: 25%;
        border-radius: 1em;
        background-color: var(--f3f3f3);
        right: -6em;
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
</style>

<div class="bigBox">
    <div class="gameManagers">
        <div class="heading">Starters</div>
        <div class="container">
            {#each gameManagers as manager}
                <div class="managerBlock">
                    <div class="managerInfo">
                        <img class="managerAvatar" src="{manager.info.avatar}" alt="avatar">
                        <div class="managerName">{manager.info.name}</div>
                    </div>
                    <div class="managerStarters">
                        {#each manager.starters as starter}
                            {#if starter.playerID == game.home || starter.playerID == game.away}
                                <img class="defenseAvatar" src="{starter.avatar}" alt="starter">
                            {:else}
                                <img class="playerAvatar" src="{starter.avatar}" alt="starter">
                            {/if}
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
    <div class="viewPlayer">

    </div>
</div>