<script>
    import MatchScore from "./MatchScore.svelte";

    export let weekMatchups, week, managerInfo, matchSelection, completeGames, playersInfo;

    let matchScores = [];
    const matchesObj = {};

    for(const matchup in weekMatchups) {
        const matchTeams = weekMatchups[matchup];
        let matchID = matchTeams[0].matchID;

        let toPlay = {
            0: matchTeams[0].starters.length,
            1: matchTeams[1].starters.length,
        };
        for(let i = 0; i < matchTeams.length; i++) {
            for(const starter of matchTeams[i].starters) {
                if(starter == '0' || playersInfo.players[starter].wi[week].o == null || completeGames.includes(starter) || completeGames.includes(playersInfo.players[starter].t)) {
                    toPlay[i] --;
                }
            }
        }

        matchesObj[matchID] = {
            matchID,
            home: {
                recordManID: matchTeams[0].recordManID,
                fpts: matchTeams[0].totalFpts,
                matchInfo: matchTeams[0],
                rosterID: matchTeams[0].rosterID,
                manager: managerInfo[matchTeams[0].recordManID],
                toPlay: toPlay[0],
            },
            away: {
                recordManID: matchTeams[1].recordManID,
                fpts: matchTeams[1].totalFpts,
                matchInfo: matchTeams[1],
                rosterID: matchTeams[1].rosterID,
                manager: managerInfo[matchTeams[1].recordManID],
                toPlay: toPlay[1],
            },
        }

        matchScores.push(matchesObj[matchID]);
    }
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
        justify-content: flex-start;
        align-items: center;
		box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }
</style>

<div class="scoresHolder">
    {#each matchScores as {matchID, home, away}} 
        <MatchScore  {matchID} {home} {away} bind:matchSelection={matchSelection} />
    {/each}
</div>