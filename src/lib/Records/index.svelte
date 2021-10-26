<script>
    import { getLeagueRecords, getLeagueTransactions } from '$lib/utils/helper'; 

    import AllTimeRecords from './AllTimeRecords.svelte';
    import PerSeasonRecords from './PerSeasonRecords.svelte';

    export let leagueRecords, totals, stale;

    const refreshTransactions = async () => {
        const newTransactions = await getLeagueTransactions(false, true);
        totals = newTransactions.totals;
    }

    let {leagueRosterRecords, currentManagers, seasonWeekRecords, currentYear, lastYear, leagueWeekRecords, leagueRecordArrays } = leagueRecords;

    const refreshRecords = async () => {
        const newRecords = await getLeagueRecords(true);

        // update values with new data
        leagueRecords = newRecords;
        leagueRosterRecords = newRecords.leagueRosterRecords;
        leagueWeekRecords = newRecords.leagueWeekRecords;
        currentManagers = newRecords.currentManagers;
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
        margin: 0 auto;
        width: 100%;
        max-width: 1200px;
    }

    .empty {
        margin: 10em 0 4em;
        text-align: center;
    }
</style>

<div class="rankingsWrapper">
    {#if leagueWeekRecords.length}
        <AllTimeRecords transactionTotals={totals} {leagueWeekRecords} {leagueRosterRecords} {currentManagers} {leagueRecordArrays} />
    {:else}
        <p class="empty">No records <i>yet</i>...</p>
    {/if}
    <PerSeasonRecords transactionTotals={totals} {leagueRosterRecords} {seasonWeekRecords} {currentManagers} {currentYear} {lastYear} />
</div>
