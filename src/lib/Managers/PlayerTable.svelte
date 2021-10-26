<script>
  	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table'; 
    import Button, { Group, Label } from '@smui/button';
    import { generateGraph, gotoManager, round } from '$lib/utils/helper';
    import { getManagerRecords } from '$lib/utils/helper';
    import { managerrecords } from '$lib/stores';


    export let recordManID;

    let showEmpty = new Boolean (false);
    let emptyMessage;
    let selection = 'regular';
    let recordPrefix;

    let weekBests, weekWorsts, blowoutBests, blowoutWorsts, narrowBests, narrowWorsts;

    let managerRecords;
    const refreshRecords = async () => {
        const newRecords = await getManagerRecords(managerrecords);
        managerrecords.update(() => newRecords);
        managerRecords = newRecords;

        if(displayStats == 'regular') {
            setRegularTable(managerRecords);
        } else if(displayStats == 'playoffs') {
            setPlayoffsTable(managerRecords);
        } else if(displayStats == 'combined') {
            setCombinedTable(managerRecords);
        }
    }
  
    refreshRecords(managerrecords);
    

    const setRegularTable = (managerRecords) => {
        recordPrefix = "Regular Season";
        selection = 'regular';
        showEmpty = false;

        weekBests = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].week_Best;
        weekWorsts = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].week_Worst;
        blowoutBests = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].blowout_Best;
        blowoutWorsts = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].blowout_Worst;
        narrowBests = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].narrow_Best;
        narrowWorsts = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].narrow_Worst;
    }

    const setPlayoffsTable = (managerRecords) => {
        recordPrefix = "Playoffs";
        selection = 'playoffs';

        if(managerRecords.managerRecordArrays.alltime.playoffs[recordManID]) {
            showEmpty = false;

            weekBests = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].week_Best;
            weekWorsts = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].week_Worst;
            blowoutBests = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].blowout_Best;
            blowoutWorsts = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].blowout_Worst;
            narrowBests = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].narrow_Best;
            narrowWorsts = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].narrow_Worst;
        } else {
            showEmpty = true;
            emptyMessage = "No Playoff Records Yet...";
        }
    }

    const setCombinedTable = (managerRecords) => {
        recordPrefix = "Combined";
        selection = 'combined';
        showEmpty = false;

        weekBests = managerRecords.managerRecordArrays.alltime.combined[recordManID].week_Best;
        weekWorsts = managerRecords.managerRecordArrays.alltime.combined[recordManID].week_Worst;
        blowoutBests = managerRecords.managerRecordArrays.alltime.combined[recordManID].blowout_Best;
        blowoutWorsts = managerRecords.managerRecordArrays.alltime.combined[recordManID].blowout_Worst;
        narrowBests = managerRecords.managerRecordArrays.alltime.combined[recordManID].narrow_Best;
        narrowWorsts = managerRecords.managerRecordArrays.alltime.combined[recordManID].narrow_Worst;
    }

    let displayStats;

    const changeSelection = (selection) => {
        displayStats = selection;
        refreshRecords(displayStats);
    }

    $: changeSelection(selection);

</script>

<!-- svelte-ignore non-top-level-reactive-declaration -->
<style>

    :global(.header) {
        text-align: center;
    }

    :global(.recordTable) {
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
        margin: 2em;
    }

    .playerAvatar {
		vertical-align: middle;
		height: 45px;
		width: 45px;
		background-position: center;
		background-repeat: no-repeat;
		background-size: auto 45px;
	}

    .playerInfo {
        display: inline-block;
        /* display: flex; */
        padding: 0 0 0 20px;
    }

    .showEmpty {
        text-align: center;
    }

    .fantasyTeamName {
        font-style: italic;
        color: #999;
        font-size: 0.8em;
        line-height: 1.1em;
    }

    .fullFlex {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        margin: 3em auto 5em;
    }

    .buttonHolder {
        text-align: center;
        margin: 2em 0 4em;
    }

    :global(.cellName) {
        cursor: pointer;
        line-height: 1.2em;
    }

    .center {
        text-align: center;
    }

    .left {
        text-align: left;
    }

        /* Start button resizing */

        @media (max-width: 540px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.6em;
        }
    }

    @media (max-width: 415px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.5em;
            padding: 0 6px;
        }
    }

    @media (max-width: 315px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.45em;
            padding: 0 3px;
        }
    }

    /* End button resizing */

    /* Start record table resizing */

    @media (max-width: 510px) {
        :global(.recordTable th) {
            font-size: 0.8em;
            padding: 1px 5px;
        }
        :global(.recordTable td) {
            font-size: 0.8em;
            padding: 1px 12px;
        }
    }

    @media (max-width: 435px) {
        :global(.rank) {
            padding: 1px 0 1px 5px !important;
        }
        :global(.rank) {
            padding: 1px 0 1px 5px !important;
        }
    }

    @media (max-width: 420px) {
        :global(.recordTable th) {
            font-size: 0.6em;
            padding: 1px 5px;
        }
        :global(.recordTable td) {
            font-size: 0.6em;
            padding: 1px 12px;
        }
    }

    @media (max-width: 330px) {
        :global(.recordTable th) {
            font-size: 0.5em;
            padding: 1px 5px;
        }
        :global(.recordTable td) {
            font-size: 0.5em;
            padding: 1px 8px;
        }
    }

    /* END record table resizing */

</style>

<div class="buttonHolder">
    <Group variant="outlined">
        <Button class="selectionButtons" on:click={() => changeSelection('regular')} variant="{selection == 'regular' ? "raised" : "outlined"}">
            <Label>Regular Season</Label>
        </Button>
        <Button class="selectionButtons" on:click={() => changeSelection('playoffs')} variant="{selection == 'playoffs' ? "raised" : "outlined"}">
            <Label>Playoffs</Label>
        </Button>
        <Button class="selectionButtons" on:click={() => changeSelection('combined')} variant="{selection == 'combined' ? "raised" : "outlined"}">
            <Label>Combined</Label>
        </Button>
    </Group>
</div>

<div class="fullFlex">
        <!-- <DataTable class="recordTable">
            <Head>
                <Row>
                    <Cell class="header" colspan=9>
                        <p>
                            Top 10 Week Scores – Players<br>
                            {prefix} – {recordPrefix} 
                        </p>
                    </Cell>                  
                </Row>
                <Row>
                    <Cell class="header rank"></Cell>
                    <div class="playerAvatar playerInfo" />
                    <Cell class="header">Player</Cell>
                    <Cell class="header">POS</Cell>
                    <Cell class="header">NFL Team</Cell>
                    <Cell class="header">Manager</Cell>
                    <Cell class="header">Year</Cell>
                    <Cell class="header">Week</Cell>
                    <Cell class="header">Rank</Cell>
                    <Cell class="header">PF</Cell>
                </Row>
            </Head>
            <Body>
                {#each playerWeekBests as playerWeekBest, ix}
                    <Row>
                        <Cell class="rank">{ix + 1}</Cell>
                        <div class="playerAvatar playerInfo" style="{playerWeekBest.avatar}" />
                        <Cell class="left">{playerWeekBest.playerInfo.fn} {playerWeekBest.playerInfo.ln}</Cell>
                        <Cell class="center">{playerWeekBest.playerInfo.pos}</Cell>
                        <Cell class="center">{playerWeekBest.playerInfo.t}</Cell>
                        <Cell class="cellName" on:click={() => gotoManager(playerWeekBest.recordManID)}>
                            {playerWeekBest.manager.realname}
                                <div class="fantasyTeamName">({playerWeekBest.manager.name})</div>
                        </Cell>
                        <Cell class="center">{playerWeekBest.year}</Cell>
                        <Cell class="center">{playerWeekBest.week}</Cell>
                        <Cell class="center">{playerWeekBest.starterRank}</Cell>
                        <Cell class="center">{round(playerWeekBest.playerPoints)}</Cell>
                    </Row>
                {/each}
            </Body>
        </DataTable> -->
    {#if showEmpty == false}
        {#if weekBests && weekBests.length}
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=4>
                            <p>
                                Personal Best Week Scores<br>
                                {recordPrefix} 
                            </p>
                        </Cell>  
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                            <!-- {#if allTime} -->
                                <Cell class="header">Year</Cell>
                            <!-- {/if} -->
                        <Cell class="header">Week</Cell>
                        <Cell class="header">PF</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each weekBests as weekBest, ix}
                        <Row>
                            <Cell>{ix + 1}</Cell>
                                <!-- {#if allTime}				 -->
                                    <Cell class="center">{weekBest.year}</Cell>
                                <!-- {/if} -->
                            <Cell class="center">{weekBest.week}</Cell>
                            <Cell class="center">{round(weekBest.fpts)}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        {/if}

        {#if weekWorsts && weekWorsts.length}
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=4>
                            <p>
                                Personal Worst Week Scores<br>
                                {recordPrefix} 
                            </p>
                        </Cell>  
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                            <!-- {#if allTime} -->
                                <Cell class="header">Year</Cell>
                            <!-- {/if} -->
                        <Cell class="header">Week</Cell>
                        <Cell class="header">PF</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each weekWorsts as weekWorst, ix}
                        <Row>
                            <Cell>{ix + 1}</Cell>
                                <!-- {#if allTime}				 -->
                                    <Cell class="center">{weekWorst.year}</Cell>
                                <!-- {/if} -->
                            <Cell class="center">{weekWorst.week}</Cell>
                            <Cell class="center">{round(weekWorst.fpts)}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        {/if}


        {#if blowoutBests && blowoutBests.length}
            <DataTable class="recordTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=5>
                            <p>
                                Top 10 Blowouts Won<br>
                                {recordPrefix} 
                            </p>
                        </Cell>                  
                    </Row>
                    <Row>
                        <Cell class="header rank"></Cell>
                        <Cell class="header">Matchup</Cell>
                            <!-- {#if allTime} -->
                                <Cell class="header">Year</Cell>
                            <!-- {/if} -->
                        <Cell class="header">Week</Cell>
                        <Cell class="header">Diff</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each blowoutBests as blowoutBest, ix}
                        <Row>
                            <Cell class="rank">{ix + 1}</Cell>
                            <Cell class="cellName center differentialName">
                                <div class="center" on:click={() => gotoManager(blowoutBest.recordManID)}>
                                    {blowoutBest.manager.realname} ({round(blowoutBest.fpts)})
                                    <!-- {#if !allTime} -->
                                        <div class="fantasyTeamName">({blowoutBest.manager.name})</div>
                                    <!-- {/if} -->
                                </div>
                                vs
                                <div class="center" on:click={() => gotoManager(blowoutBest.againstRecordManID)}>
                                    {blowoutBest.againstManager.realname} ({round(blowoutBest.fptsAgainst)})
                                    <!-- {#if !allTime} -->
                                        <div class="fantasyTeamName">({blowoutBest.againstManager.name})</div>
                                    <!-- {/if} -->
                                </div>
                            </Cell>
                                <!-- {#if allTime} -->
                                    <Cell class="center">{blowoutBest.year}</Cell>
                                <!-- {/if} -->
                            <Cell class="center">{blowoutBest.week}</Cell>
                            <Cell class="center">{round(blowoutBest.matchDifferential)}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        {/if}

        {#if blowoutWorsts && blowoutWorsts.length}
            <DataTable class="recordTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=5>
                            <p>
                                Top 10 Blowouts Lost<br>
                                {recordPrefix} 
                            </p>
                        </Cell>                  
                    </Row>
                    <Row>
                        <Cell class="header rank"></Cell>
                        <Cell class="header">Matchup</Cell>
                            <!-- {#if allTime} -->
                                <Cell class="header">Year</Cell>
                            <!-- {/if} -->
                        <Cell class="header">Week</Cell>
                        <Cell class="header">Diff</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each blowoutWorsts as blowoutWorst, ix}
                        <Row>
                            <Cell class="rank">{ix + 1}</Cell>
                            <Cell class="cellName center differentialName">
                                <div class="center" on:click={() => gotoManager(blowoutWorst.recordManID)}>
                                    {blowoutWorst.manager.realname} ({round(blowoutWorst.fpts)})
                                    <!-- {#if !allTime} -->
                                        <div class="fantasyTeamName">({blowoutWorst.manager.name})</div>
                                    <!-- {/if} -->
                                </div>
                                vs
                                <div class="center" on:click={() => gotoManager(blowoutWorst.againstRecordManID)}>
                                    {blowoutWorst.againstManager.realname} ({round(blowoutWorst.fptsAgainst)})
                                    <!-- {#if !allTime} -->
                                        <div class="fantasyTeamName">({blowoutWorst.againstManager.name})</div>
                                    <!-- {/if} -->
                                </div>
                            </Cell>
                                <!-- {#if allTime} -->
                                    <Cell class="center">{blowoutWorst.year}</Cell>
                                <!-- {/if} -->
                            <Cell class="center">{blowoutWorst.week}</Cell>
                            <Cell class="center">{round(blowoutWorst.matchDifferential)}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        {/if}

        {#if narrowBests && narrowBests.length}
            <DataTable class="recordTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=5>
                            <p>
                                Top 10 Narrowest Victories<br>
                                {recordPrefix} 
                            </p>
                        </Cell>                  
                    </Row>
                    <Row>
                        <Cell class="header rank"></Cell>
                        <Cell class="header">Matchup</Cell>
                            <!-- {#if allTime} -->
                                <Cell class="header">Year</Cell>
                            <!-- {/if} -->
                        <Cell class="header">Week</Cell>
                        <Cell class="header">Diff</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each narrowBests as narrowBest, ix}
                        <Row>
                            <Cell class="rank">{ix + 1}</Cell>
                            <Cell class="cellName center differentialName">
                                <div class="center" on:click={() => gotoManager(narrowBest.recordManID)}>
                                    {narrowBest.manager.realname} ({round(narrowBest.fpts)})
                                    <!-- {#if !allTime} -->
                                        <div class="fantasyTeamName">({narrowBest.manager.name})</div>
                                    <!-- {/if} -->
                                </div>
                                vs
                                <div class="center" on:click={() => gotoManager(narrowBest.againstRecordManID)}>
                                    {narrowBest.againstManager.realname} ({round(narrowBest.fptsAgainst)})
                                    <!-- {#if !allTime} -->
                                        <div class="fantasyTeamName">({narrowBest.againstManager.name})</div>
                                    <!-- {/if} -->
                                </div>
                            </Cell>
                                <!-- {#if allTime} -->
                                    <Cell class="center">{narrowBest.year}</Cell>
                                <!-- {/if} -->
                            <Cell class="center">{narrowBest.week}</Cell>
                            <Cell class="center">{round(narrowBest.matchDifferential)}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        {/if}

        {#if narrowWorsts && narrowWorsts.length}
            <DataTable class="recordTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=5>
                            <p>
                                Top 10 Narrowest Defeats<br>
                                {recordPrefix} 
                            </p>
                        </Cell>                  
                    </Row>
                    <Row>
                        <Cell class="header rank"></Cell>
                        <Cell class="header">Matchup</Cell>
                            <!-- {#if allTime} -->
                                <Cell class="header">Year</Cell>
                            <!-- {/if} -->
                        <Cell class="header">Week</Cell>
                        <Cell class="header">Diff</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each narrowWorsts as narrowWorst, ix}
                        <Row>
                            <Cell class="rank">{ix + 1}</Cell>
                            <Cell class="cellName center differentialName">
                                <div class="center" on:click={() => gotoManager(narrowWorst.recordManID)}>
                                    {narrowWorst.manager.realname} ({round(narrowWorst.fpts)})
                                    <!-- {#if !allTime} -->
                                        <div class="fantasyTeamName">({narrowWorst.manager.name})</div>
                                    <!-- {/if} -->
                                </div>
                                vs
                                <div class="center" on:click={() => gotoManager(narrowWorst.againstRecordManID)}>
                                    {narrowWorst.againstManager.realname} ({round(narrowWorst.fptsAgainst)})
                                    <!-- {#if !allTime} -->
                                        <div class="fantasyTeamName">({narrowWorst.againstManager.name})</div>
                                    <!-- {/if} -->
                                </div>
                            </Cell>
                                <!-- {#if allTime} -->
                                    <Cell class="center">{narrowWorst.year}</Cell>
                                <!-- {/if} -->
                            <Cell class="center">{narrowWorst.week}</Cell>
                            <Cell class="center">{round(narrowWorst.matchDifferential)}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        {/if}
    {:else}
        <div class="showEmpty">{emptyMessage}</div>
    {/if}
</div>