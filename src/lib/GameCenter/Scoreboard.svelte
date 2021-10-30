<script>
    import GameScore from './GameScore.svelte';

    export let nflMatchups, week;
    
    let gameScores = [];
    const gamesObj = {};

    for(const matchup in nflMatchups) {
        const matchTeams = nflMatchups[matchup];
        let gameID = matchTeams[0].gameID
        gamesObj[gameID] = {
            gameID,
            home: matchTeams[0],
            away: matchTeams[1],
        }
        gameScores.push(gamesObj[gameID]);
    }
</script>

<style>
    .scoresHolder {
        position: relative;
        padding: 10px;
        z-index: 1;
        width: 267px;
        min-height: 100%;
        background-color: var(--fff);
		box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }
</style>

<div class="scoresHolder">
    {#each gameScores as {gameID, home, away}} 
        <GameScore {gameID} {home} {away} />
    {/each}
</div>



