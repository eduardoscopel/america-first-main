<script>
    export let gameID, home, away, gameSelection = gameID;

    let timezone = 'CST';
    let isComplete = home.status.type.completed;
    let gameState = home.status.type.state;
    let kickoffDay;
    let kickoffTime;

    let gameStatus = {
        quarter: home.status.period,
        clock: home.status.displayClock,
    }

    if(isComplete == true) {
        gameStatus.quarter = "Final";
        gameStatus.clock = "";
    }
    let newGameSelection
    const changeGameSelection = (gameID) => {
        newGameSelection = gameID;
        gameSelection = newGameSelection;
        return gameSelection;
    }
    

    const timezoneShift = (timezone, time) => {
        let timeHour;
        if(time.slice(0, 2) == '12') {
            timeHour = 12;
        } else {
            let strTimeHour = time.slice(1, 2);
            timeHour = parseInt(strTimeHour);
        }

        if(timezone == 'CST') {
            if(timeHour == 1) {
                timeHour = 12;
            } else {
                timeHour = timeHour - 1;
            }
        } else if(timezone == 'MST') {
            if(timeHour == 1) {
                timeHour = 11;
            } else if(timeHour == 2) {
                timeHour = 12;
            } else {
                timeHour = timeHour - 2;
            }
        } else if(timezone == 'PST') {
            if(timeHour == 1) {
                timeHour = 10;
            } else if(timeHour == 2) {
                timeHour = 11;
            } else if(timeHour == 3) {
                timeHour = 12;
            } else {
                timeHour = timeHour - 3;
            }
        }

        let shiftedTime;
        if(time.slice(0, 2) == '12') {
            shiftedTime = timeHour.toString() + time.slice(3)
        } else {
            shiftedTime = timeHour.toString() + time.slice(2)
        }
       
        return shiftedTime;
    }

    if(gameState == 'pre') {
        kickoffDay = home.status.type.detail.slice(0, 3);
        let timeUnshifted = home.status.type.shortDetail.slice(home.status.type.shortDetail.length - 12, home.status.type.shortDetail.length - 4);
        kickoffTime = timezoneShift(timezone, timeUnshifted);

        gameStatus.quarter = kickoffDay;
        gameStatus.clock = kickoffTime;
    }


</script>

<style>
    .scoresBlock {
        position: relative;
        z-index: auto;
        margin: 0.5em 0;
        width: 100%;
        max-width: 1100px;
        min-height: 100%;
		background-color: var(--f3f3f3);
		box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }

    .teamsBlock {
        display: inline-flex;
        position: relative;
        z-index: auto;
        background-color: var(--f3f3f3);
        padding: 0.7em;
        align-items: center;
    }

    .teamLogo {
        display: inline-block;
        max-width: 40px;
        padding: 0 1em 0 0;
    }

    .teamAbbrev {
        display: inherit;
        position: relative;
        z-index: auto;
        font-weight: 600;
        font-size: 1.1em;
        padding: 0 0 0 0.2em;
    }

    .teamScore {
        color: #999;
        display: inline-flex;
        position: absolute;
        z-index: auto;
        font-weight: 500;
        font-size: 1.05em;
        padding: 0 0 0 7em;
    }

    :global(.scoresBlock:hover) {
        cursor: pointer;
        opacity: 1;
    }

    .gameComplete {
        display: inline-flex;
        position: absolute;
        align-items: center;
        padding: 7.75em 0 0 2em;
        font-size: 1.05em;
        justify-content: center;
    }

    .gameStatusWrapper {
        display: flex;
        position: absolute;
        z-index: auto;
        padding: 0 0 0 11.75em;
        line-height: 1em;
        align-items: center;
        justify-content: center;
        top: 0em;
    }

    .gameStatusPeriod {
        display: inline-flex;
        position: relative;
        z-index: auto;
        font-size: 1.05em;
        align-content: center;
        justify-content: center;
        padding: 1.75em 0 0 0;
    }

    .gameStatusClock {
        display: inline-flex;
        position: absolute;
        z-index: auto;
        font-size: 1.05em;
        align-content: center;
        justify-content: center;
        padding: 7.75em 0 0 0;
        width: 5em;
        left: 9.75em;
    }
</style>

<div class="scoresBlock" on:click={() => changeGameSelection(gameID)}>
    <div class="teamsBlock">
        <img class="teamLogo" src="https://sleepercdn.com/images/team_logos/nfl/{home.sleeperID.toLowerCase()}.png" alt="{home.sleeperID}"/>
        <div class="teamAbbrev">{home.sleeperID}</div>
        <div class="teamScore">{home.score}</div>
    </div>
    <br>
    <div class="teamsBlock">
        <img class="teamLogo" src="https://sleepercdn.com/images/team_logos/nfl/{away.sleeperID.toLowerCase()}.png" alt="{away.sleeperID}"/>
        <div class="teamAbbrev">{away.sleeperID}</div>
        <div class="teamScore">{away.score}</div>
    </div>
    <div class="gameStatusWrapper">
        {#if !isComplete}
            <div class="gameStatusPeriod">
                {gameStatus.quarter}
            </div>
            <div class="gameStatusClock">
                {gameStatus.clock}
            </div>
        {:else}
            <div class="gameComplete">
                Final
            </div>
        {/if}
    </div>
</div>