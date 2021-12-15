<script>
	import {cleanName, gotoManager, round} from '$lib/utils/helper';
  	// import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
	import TransactionMove from './TransactionMove.svelte';

	export let transaction, masterOffset, currentManagers, players;

	const numTraders = transaction.type == 'trade' ? transaction.rosters.length : 0;

</script>

<style>
	:global(.transaction) {
		display: block;
		width: 100%;
		margin: 15px auto;
		border: 1px solid var(--ccc);
		box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
	}

	:global(.transaction table) {
		table-layout:fixed !important;
		width: 100%;
	}

	:global(.transactTeam) {
		text-align: center;
		padding: 5px 0;
		background-color: var(--transactHeader);
	}

	:global(.transact-date) {
		text-align: center;
		padding: 5px 0;
		background-color: var(--transactHeader);
		color: #888;
		font-style: italic;
	}

	.avatar {
		vertical-align: middle;
		border-radius: 50%;
		height: 40px;
		width: 40px;
		margin: 0.1em;
		border: 0.25px solid #777;
	}

	.currentOwner {
		display: block;
		font-style: italic;
		font-size: 0.8em;
		color: #aaa;
	}

	.clickable {
		cursor: pointer;
	}

	:global(.trans) {
		position: relative;
		display: inline-flex;
		width: 100%;
	}

	:global(.transDate) {
		position: relative;
		display: inline-flex;
		width: 100%;
		padding: 5px 0;
		background-color: var(--transactHeader);
		color: #888;
		font-style: italic;
		align-items: center;
		justify-content: center;
	}

	:global(.transWrapper) {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		width: 100%;
		margin: 15px auto;
		border: 1px solid var(--ccc);
		box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
	}

	:global(.transManager) {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		width: 25%;
		padding: 5px 0;
		background-color: var(--transactHeader);
		align-items: center;
		justify-content: center;
	}

	:global(.price) {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 25%;
		background-color: var(--transactHeader);
	}

	.columnWrap {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
	}

	.rowWrap {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.header {
		position: relative;
		display: inline-flex;
	}
</style>

<div class="transWrapper">
	<div class="trans">
		{#if transaction.type == 'trade'}
			{#if numTraders == 2}
				<div class="transManager">
					{#if transaction.previousOwners && cleanName(transaction.previousOwners[0].name) != cleanName(currentManagers[transaction.recordManIDs[0]].name)}
						<img class="avatar clickable" on:click={() => gotoManager(transaction.recordManIDs[0])} src="{transaction.previousOwners[0].avatar}" alt="{transaction.previousOwners[0].name} avatar"/>
						<span class="clickable" on:click={() => gotoManager(transaction.recordManIDs[0])}>{transaction.previousOwners[0].name}</span>
						<span class="currentOwner">({currentManagers[transaction.recordManIDs[0]].name})</span>
					{:else}
						<img class="avatar clickable" on:click={() => gotoManager(transaction.recordManIDs[0])} src="{currentManagers[transaction.recordManIDs[0]].avatar}" alt="{currentManagers[transaction.recordManIDs[0]].name} avatar"/>
						<span class="clickable" on:click={() => gotoManager(transaction.recordManIDs[0])}>{currentManagers[transaction.recordManIDs[0]].name}</span>
					{/if}
				</div>
			{/if}
		{:else}
			{#each transaction.recordManIDs as owner, ix}
				<div class="transManager">
					{#if transaction.previousOwners && cleanName(transaction.previousOwners[ix].name) != cleanName(currentManagers[owner].name)}
						<img class="avatar clickable" on:click={() => gotoManager(owner)} src="{transaction.previousOwners[ix].avatar}" alt="{transaction.previousOwners[ix].name} avatar"/>
						<span class="clickable" on:click={() => gotoManager(owner)}>{transaction.previousOwners[ix].name}</span>
						<span class="currentOwner">({currentManagers[owner].name})</span>
					{:else}
						<img class="avatar clickable" on:click={() => gotoManager(owner)} src="{currentManagers[owner].avatar}" alt="{currentManagers[owner].name} avatar"/>
						<span class="clickable" on:click={() => gotoManager(owner)}>{currentManagers[owner].name}</span>
					{/if}
				</div>
			{/each}
		{/if}
		{#each transaction.moves as move}
			<TransactionMove {players} {move} number={transaction.moves.length} type={transaction.type} {masterOffset} {currentManagers} />
		{/each}
		{#if transaction.type == 'trade'}
			{#if numTraders == 2}
				<div class="transManager">
					{#if transaction.previousOwners && cleanName(transaction.previousOwners[1].name) != cleanName(currentManagers[transaction.recordManIDs[1]].name)}
						<img class="avatar clickable" on:click={() => gotoManager(transaction.recordManIDs[1])} src="{transaction.previousOwners[1].avatar}" alt="{transaction.previousOwners[1].name} avatar"/>
						<span class="clickable" on:click={() => gotoManager(transaction.recordManIDs[1])}>{transaction.previousOwners[1].name}</span>
						<span class="currentOwner">({currentManagers[transaction.recordManIDs[1]].name})</span>
					{:else}
						<img class="avatar clickable" on:click={() => gotoManager(transaction.recordManIDs[1])} src="{currentManagers[transaction.recordManIDs[1]].avatar}" alt="{currentManagers[transaction.recordManIDs[1]].name} avatar"/>
						<span class="clickable" on:click={() => gotoManager(transaction.recordManIDs[1])}>{currentManagers[transaction.recordManIDs[1]].name}</span>
					{/if}
				</div>
			{/if}
		{:else}
			<div class="price" style="justify-content: space-between;">
				<div class="columnWrap">
					<div class="header">$ BID</div>
					<div class="header">{transaction.moves[0][0].bid ? transaction.moves[0][0].bid : '0'}</div>
				</div>
				<div class="columnWrap">
					<div class="header">% REM</div>
					<div class="header">{transaction.moves[0][0].bid ? round(transaction.moves[0][0].budgetPercs.remaining) : '0'}</div>
				</div>
				<div class="columnWrap">
					<div class="header">% TOT</div>
					<div class="header">{transaction.moves[0][0].bid ? round(transaction.moves[0][0].budgetPercs.total) : '0'}</div>
				</div>
			</div>
		{/if}
	</div>
	<div class="transDate">
		{transaction.date}
	</div>
</div>

<!-- <DataTable class="transaction">
	<Head class="teams">
		<Row>
			{#each transaction.rosters as owner, ix}
				<Cell class="transactTeam">
					{#if transaction.previousOwners && cleanName(transaction.previousOwners[ix].name) != cleanName(currentManagers[owner].name)}
						<img class="avatar clickable" on:click={() => gotoManager(owner)} src="{transaction.previousOwners[ix].avatar}" alt="{transaction.previousOwners[ix].name} avatar"/>
						<br /><span class="clickable" on:click={() => gotoManager(owner)}>{transaction.previousOwners[ix].name}</span>
						<span class="currentOwner">({currentManagers[owner].name})</span>
					{:else}
						<img class="avatar clickable" on:click={() => gotoManager(owner)} src="{currentManagers[owner].avatar}" alt="{currentManagers[owner].name} avatar"/>
						<br /><span class="clickable" on:click={() => gotoManager(owner)}>{currentManagers[owner].name}</span>
					{/if}
				</Cell>
			{/each}
		</Row>
	</Head>
	<Body class="moves">
		{#each transaction.moves as move}
			<TransactionMove {players} {move} type={transaction.type} {masterOffset} {currentManagers} />
		{/each}
		<Row>
			<Cell class="transact-date" colspan={transaction.rosters.length}>{transaction.date}</Cell>
		</Row>
	</Body>
</DataTable> -->





