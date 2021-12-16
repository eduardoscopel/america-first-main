<script>
	import { goto } from '$app/navigation';
	import { getLeagueTransactions, getLeagueData, loadPlayers, waitForAll, leagueID } from '$lib/utils/helper';
	import LinearProgress from '@smui/linear-progress';
	import { onMount } from 'svelte';
	import Transaction from './Transaction.svelte';

	export let masterOffset = 0;

	let loading = true;
	let players, transactions, currentManagers, prevManagers, waiverType;

	onMount(async () => {
		const [transactionsData, playersData, leagueData] = await waitForAll(getLeagueTransactions(true),loadPlayers(), getLeagueData(leagueID));
		players = playersData.players;
		transactions = transactionsData.transactions;
		currentManagers = transactionsData.currentManagers;
		prevManagers = transactionsData.prevManagers;
		waiverType = leagueData.settings.waiver_type;

		if(transactionsData.stale) {
			const newTransactions = await getLeagueTransactions(true, true);
			transactions = newTransactions.transactions;
			currentManagers = newTransactions.currentManagers;
			prevManagers = newTransactions.prevManagers;
		}
		if(playersData.stale) {
			const newPlayersData = await loadPlayers(true);
			players = newPlayersData.players;
		}

		loading = false;
	})




</script>

<style>
	.transactions {
		position: relative;
		width: 100%;
		z-index: 1;
	}

	p {
		text-align: center;
	}

	h5 {
		text-align: center;
		margin: 10px auto 16px;
	}

	.link {
		cursor: pointer;
		color: #888;
		padding: 10px 20px;
		margin-bottom: 10px;
	}

	.link:hover {
		color: #00316b;
	}

	.nothingYet {
		margin: 5em 0;
	}

</style>

<div class="transactions">
	{#if loading}
		<p>Loading league transactions...</p>
		<LinearProgress indeterminate />
	{:else}
		<!-- waiver -->
		{#if transactions.waivers.length}
			<h5>Waiver Wire</h5>
			{#each transactions.waivers as transaction }
				<Transaction {players} {transaction} {masterOffset} {currentManagers} prevManagers={prevManagers[transaction.year]} {waiverType} />
			{/each}

			<p on:click={() => goto("/transactions?show=waiver&query=&page=1")} class="link">( view more )</p>
		{:else}
			<p class="nothingYet">No waiver moves have been made yet...</p>
		{/if}

		{#if transactions.waivers.length && transactions.trades.length}
			<br />
		{/if}

		<!-- trades -->
		{#if transactions.trades.length}
			<h5>Recent Trades</h5>
			{#each transactions.trades as transaction }
				<Transaction {players} {transaction} {masterOffset} currentManagers={currentManagers} prevManagers={prevManagers[transaction.year]} {waiverType} />
			{/each}

			<p on:click={() => goto("/transactions?show=trade&query=&page=1")} class="link">( view more )</p>
		{:else}
			<p class="nothingYet">No trades have been made yet...</p>
		{/if}
	{/if}
</div>