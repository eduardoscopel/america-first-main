<script>
	import { goto } from '$app/navigation';
	import { getLeagueTransactions, getLeagueRosters, getLeagueData, loadPlayers, waitForAll, leagueID, gotoManager } from '$lib/utils/helper';
	import LinearProgress from '@smui/linear-progress';
	import { onMount } from 'svelte';
	import Transaction from './Transaction.svelte';
	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';

	export let masterOffset = 0;

	let loading = true;
	let players, transactions, currentManagers, rosters, waiverBudget, waiverWire;

	const getWaiverWire = (rosters, waiverBudget, currentManagers) => {
		waiverWire = [];
		for(const key in rosters) {
			const remainingFaab = waiverBudget - rosters[key].settings.waiver_budget_used;
			waiverWire.push({
				rosterID: rosters[key].roster_id,
				faab: remainingFaab,
				priority: rosters[key].settings.waiver_position,
				manager: currentManagers[rosters[key].roster_id],
			})
		}
		waiverWire = waiverWire.sort((a, b) => a.priority - b.priority);
	}

	onMount(async () => {
		const [transactionsData, playersData, rostersData, leagueData] = await waitForAll(getLeagueTransactions(true),loadPlayers(),getLeagueRosters(leagueID), getLeagueData(leagueID));
		players = playersData.players;
		transactions = transactionsData.transactions;
		currentManagers = transactionsData.currentManagers;
		rosters = rostersData.rosters;
		waiverBudget = leagueData.settings.waiver_budget;

		if(transactionsData.stale) {
			const newTransactions = await getLeagueTransactions(true, true);
			transactions = newTransactions.transactions;
			currentManagers = newTransactions.currentManagers;
		}
		if(playersData.stale) {
			const newPlayersData = await loadPlayers(true);
			players = newPlayersData.players;
		}
		if(rosters) {
			getWaiverWire(rosters, waiverBudget, currentManagers);
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

	.avatar {
		vertical-align: middle;
		border-radius: 50%;
		height: 25px;
		width: 25px;
		margin: 0 0.2em 0 0;
		border: 0.25px solid #777;
	}

	.clickable {
		cursor: pointer;
	}
</style>

<div class="transactions">
	{#if loading}
		<p>Loading league transactions...</p>
		<LinearProgress indeterminate />
	{:else}
		<!-- waiver wire summary -->
		{#if waiverWire.length}
			<DataTable table$aria-label="Waiver Priority" style="width: 100%; box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);">
				<Head> 
					<Row>
						<Cell class="center" />
						<Cell class="center">Team</Cell>
						<Cell class="center">FAAB</Cell>
					</Row>
				</Head>
				<Body>
					{#each waiverWire as waiver}
						<Row>
							<Cell class="center">{waiver.priority}</Cell>
							<Cell class="cellname">
								<img class="avatar clickable" on:click={() => gotoManager(waiver.rosterID)} src="{waiver.manager.avatar}" alt="{waiver.manager.name} avatar"/>
								{waiver.manager.name}
							</Cell>
							<Cell class="center">${waiver.faab}</Cell>
						</Row>
					{/each}
				</Body>
			</DataTable>
		{/if}
		<!-- waiver -->
		{#if transactions.waivers.length}
			<h5>Waiver Wire</h5>
			{#each transactions.waivers as transaction }
				<Transaction {players} {transaction} {masterOffset} {currentManagers} />
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
				<Transaction {players} {transaction} {masterOffset} currentManagers={currentManagers} />
			{/each}

			<p on:click={() => goto("/transactions?show=trade&query=&page=1")} class="link">( view more )</p>
		{:else}
			<p class="nothingYet">No trades have been made yet...</p>
		{/if}
	{/if}
</div>