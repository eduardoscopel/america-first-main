<script>
    import GameScore from './GameScore.svelte';

    export let nflMatchups, gameSelection, completeGames, showGameBox, showMatchBox;
    
    let gameScores = [];
    const gamesObj = {};

    const getGameScores = (nflMatchups) => {
        gameScores = [];
        for(const matchup in nflMatchups) {
            const matchTeams = nflMatchups[matchup];
            let gameID = matchTeams[0].gameID
            gamesObj[gameID] = {
                gameID,
                home: matchTeams[0],
                away: matchTeams[1],
                isComplete: matchTeams[0].status.type.completed,
                gameState: matchTeams[0].status.type.state,
            }
            gameScores.push(gamesObj[gameID]);

            if(matchTeams[0].status.type.completed) {
                completeGames.push(matchTeams[0].sleeperID);
                completeGames.push(matchTeams[1].sleeperID);
            }
        }
    }
    $: getGameScores(nflMatchups);
</script>

<style>
    .scoresHolder {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        padding: 0.75em;
        margin: 0.5em;
        z-index: auto;
        width: 16.75em;
        height: 100%;
        justify-content: center;
        align-items: center;
		box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }
</style>

<div class="scoresHolder">
    {#each gameScores as {gameID, home, away, isComplete, gameState}} 
        <GameScore {gameID} {home} {away} {isComplete} {gameState} bind:gameSelection={gameSelection} bind:showGameBox={showGameBox} bind:showMatchBox={showMatchBox} />
    {/each}
</div>



