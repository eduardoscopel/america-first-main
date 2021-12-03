<script>
    import { getLeagueRecords, getLeagueTransactions } from '$lib/utils/helper'; 
    import Button, { Group, Label } from '@smui/button';
    import AllTimeRecords from './AllTimeRecords.svelte';
    import PerSeasonRecords from './PerSeasonRecords.svelte';

    export let leagueRecords, totals, stale, managerRecords;

    let masterSelection = 'alltime';
    let displayType;
    const changeMasterSelection = (masterSelection) => {
        if(masterSelection == 'alltime') {
            displayType = 'alltime';
        } else if(masterSelection == 'yearly') {
            displayType = 'yearly';
        }
        masterSelection = displayType;
        return displayType;
    }
    $: displayType = changeMasterSelection(masterSelection);

    const refreshTransactions = async () => {
        const newTransactions = await getLeagueTransactions(false, true);
        totals = newTransactions.totals;
    }

    let {leagueRosterRecords, allManagers, seasonWeekRecords, currentYear, lastYear, leagueWeekRecords, leagueRecordArrays } = leagueRecords;

    const refreshRecords = async () => {
        const newRecords = await getLeagueRecords(true);

        // update values with new data
        leagueRecords = newRecords;
        leagueRosterRecords = newRecords.leagueRosterRecords;
        leagueWeekRecords = newRecords.leagueWeekRecords;
        allManagers = newRecords.allManagers;
        seasonWeekRecords = newRecords.seasonWeekRecords;
        currentYear = newRecords.currentYear;
        lastYear = newRecords.lastYear;
        leagueRecordArrays = newRecords.leagueRecordArrays;
    }

    if(stale) {
        refreshTransactions();
    }

    if(leagueRecords.stale) {
        refreshRecords();
    }

</script>

<style>

    .rankingsWrapper {
        width: 100%;
        margin: 5% auto;
        height: 100%;
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
    }

    .mainBase {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        height: 100%;
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
        background-color: var(--gcComponent);
        border-radius: 50px;
    }

    .empty {
        margin: 10em 0 4em;
        text-align: center;
    }

    .buttonHolder {
        text-align: center;
        margin: 2em 0;
        width: 100%;
    }
</style>

<div class="rankingsWrapper">
    <div class="mainBase">
        <div class="buttonHolder">
            <Group variant="outlined">
                <Button class="selectionButtons" on:click={() => changeMasterSelection('alltime')} variant="{displayType == 'alltime' ? "raised" : "outlined"}">
                    <Label>All-Time</Label>
                </Button>
                <Button class="selectionButtons" on:click={() => changeMasterSelection('yearly')} variant="{displayType == 'yearly' ? "raised" : "outlined"}">
                    <Label>Yearly</Label>
                </Button>
            </Group>
        </div>

        {#if displayType == 'alltime'}
            {#if leagueWeekRecords.length}
                <AllTimeRecords transactionTotals={totals} {leagueWeekRecords} {leagueRosterRecords} {allManagers} {leagueRecordArrays} {managerRecords} />
            {:else}
                <p class="empty">No records <i>yet</i>...</p>
            {/if}
        {:else if displayType == 'yearly'}
            <PerSeasonRecords transactionTotals={totals} {leagueRosterRecords} {seasonWeekRecords} {allManagers} {currentYear} {lastYear} {managerRecords} />
        {/if}
    </div>
</div>
