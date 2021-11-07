<script>
    export let matchID, home, away, matchSelection = matchID;


    let newMatchSelection
    const changeMatchSelection = (matchID) => {
        newMatchSelection = matchID;
        matchSelection = newMatchSelection;
        return matchSelection;
    }

</script>

<style>
    .showSelected {
        position: relative;
        z-index: 1;
        width: 100%;
		background-color: var(--f3f3f3);
        padding: 0 0.5em;
    }

    .scoresBlock {
        position: relative;
        z-index: auto;
        margin: 0.5em 0;
        width: 100%;
		background-color: var(--f3f3f3);
    }

    :global(.scoresBlock:hover) {
        cursor: pointer;
        background-color: #181818;
    }

    .teamsBlock {
        display: inline-flex;
        position: relative;
        z-index: auto;
        padding: 0.7em;
        align-items: center;
    }

    .teamLogo {
        display: inline-flex;
        width: 2.4em;
        height: fit-content;
        margin: 0 1em 0 0;
        border: 0.25px solid #777;
        border-radius: 50%;
    }

    .teamAbbrev {
        display: inline-flex;
        position: relative;
        z-index: auto;
        color: #ededed;
        font-weight: 600;
        font-size: 1.1em;
        padding: 0 0 0 0.2em;
    }

    .teamScoreContainer {
        display: inline-flex;
        position: absolute;
        z-index: auto;
        left: 7.7em;
        width: 2em;
        align-items: center;
        justify-content: center;
    }

    .teamScore {
        color: #999;
        display: inline-flex;
        position: relative;
        z-index: auto;
        font-weight: 500;
        font-size: 1.05em;
        align-items: center;
        justify-content: center;
    }

    .gameComplete {
        display: inline-flex;
        position: relative;
        align-items: center;
        font-size: 1.05em;
        justify-content: center;
        color: #ededed;
        top: 1.25em;
    }

    .gameStatusWrapper {
        display: inline-flex;
        flex-direction: column;
        position: absolute;
        z-index: auto;
        align-items: center;
        justify-content: center;
        top: 1.75em;
        right: 0.6em;
        width: 6.5em;
    }

    .gameStatusPeriod {
        display: inline-flex;
        position: relative;
        z-index: auto;
        font-size: 1.05em;
        align-content: center;
        justify-content: center;
        color: #ededed;
    }

    .gameStatusClock {
        display: inline-flex;
        position: relative;
        z-index: auto;
        font-size: 1.05em;
        align-content: center;
        justify-content: center;
        top: 1.25em;
        color: #ededed;
    }
</style>

<div class="showSelected" style="{matchSelection == matchID ? "background-color: #222222" : null}">
    <div class="scoresBlock" on:click={() => changeMatchSelection(matchID)} style="{matchSelection == matchID ? "background-color: #181818" : null}">
        <div class="teamsBlock">
            <img class="teamLogo" src="{home.manager.avatar}" alt="{home.manager.abbreviation}"/>
            <div class="teamAbbrev">{home.manager.abbreviation}</div>
            <div class="teamScoreContainer">
                <div class="teamScore">{home.fpts}</div>
            </div>
        </div>
        <br>
        <div class="teamsBlock">
            <img class="teamLogo" src="{away.manager.avatar}" alt="{away.manager.abbreviation}"/>
            <div class="teamAbbrev">{away.manager.abbreviation}</div>
            <div class="teamScoreContainer">
                <div class="teamScore">{away.fpts}</div>
            </div>
        </div>
        <!-- <div class="gameStatusWrapper">
            {#if !isComplete}
                <div class="gameStatusPeriod">
                    {gameStatus.quarter}{gameStatus.quarterSuper}
                </div>
                <div class="gameStatusClock">
                    {gameStatus.clock}
                </div>
            {:else}
                <div class="gameComplete">
                    Final
                </div>
            {/if}
        </div> -->
    </div>
</div>