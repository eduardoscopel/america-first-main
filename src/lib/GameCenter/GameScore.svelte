<script>
    export let gameID, home, away, gameSelection = gameID, completeGames;

    let timezone = 'CST';
    let isComplete = home.status.type.completed;
    let gameState = home.status.type.state;
    let kickoffDay;
    let kickoffTime;

    let quarterSuper;
    if(home.status.period == 1) {
        quarterSuper = 'st';
    } else if(home.status.period == 2) {
        quarterSuper = 'nd';
    } else if(home.status.period == 3) {
        quarterSuper = 'rd';
    } else if(home.status.period == 4) {
        quarterSuper = 'th';
    } else {
        quarterSuper = null;
    }

    let gameStatus = {
        quarter: home.status.period,
        quarterSuper,
        clock: home.status.displayClock,
    }

    if(isComplete == true) {
        gameStatus.quarter = "Final";
        gameStatus.clock = "";
        completeGames.push(home.sleeperID);
        completeGames.push(away.sleeperID);
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
        gameStatus.quarterSuper = '';
        gameStatus.clock = kickoffTime;
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
        max-width: 40px;
        padding: 0 1em 0 0;
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
<div class="showSelected" style="{gameSelection == gameID ? "background-color: #222222" : null}">
    <div class="scoresBlock" on:click={() => changeGameSelection(gameID)} style="{gameSelection == gameID ? "background-color: #181818" : null}">
        <div class="teamsBlock">
            <img class="teamLogo" src="https://sleepercdn.com/images/team_logos/nfl/{home.sleeperID.toLowerCase()}.png" alt="{home.sleeperID}"/>
            <div class="teamAbbrev">{home.sleeperID}</div>
            <div class="teamScoreContainer">
                <div class="teamScore">{home.score}</div>
            </div>
        </div>
        <br>
        <div class="teamsBlock">
            <img class="teamLogo" src="https://sleepercdn.com/images/team_logos/nfl/{away.sleeperID.toLowerCase()}.png" alt="{away.sleeperID}"/>
            <div class="teamAbbrev">{away.sleeperID}</div>
            <div class="teamScoreContainer">
                <div class="teamScore">{away.score}</div>
            </div>
        </div>
        <div class="gameStatusWrapper">
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
        </div>
    </div>
</div>