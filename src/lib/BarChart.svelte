<script>
    import Button, { Group, Label } from '@smui/button';
    import {xIntervalFont, xIntervalHeight, barLabelFont, labelFont} from './barChartResize';
    import {min, max} from '$lib/utils/helper';

    export let graphsObj, curSort, curGraph = Object.keys(graphsObj)[0], curSubType = 'Overall', curDubType = Object.keys(graphsObj[curGraph][curSubType])[0], curPosType, curTableDesc = 'lineupIQs.iq', maxWidth = 1000, allTime, selection, displayObject, displayYear, leagueManagers, allManagers;

    const colors = [
        "#52DEE5",
        "#B4436C",
        "#4D9078",
        "#1789FC",
        "#0E273C",
        "#F78154",
        "#3777FF",
        "#4A306D",
        "#5FAD56",
        "#A33B20",
        "#F2C14E",
        "#393D3F",
    ];

    const graphKeys = Object.keys(graphsObj);

    $: subTypes = Object.keys(graphsObj[curGraph]);
    $: dubTypes = Object.keys(graphsObj[curGraph][curSubType]).includes('Best') 
                || Object.keys(graphsObj[curGraph][curSubType]).includes('Weeks') 
                || Object.keys(graphsObj[curGraph][curSubType]).includes('Bench') 
                || curSubType == 'Positions'
                ? Object.keys(graphsObj[curGraph][curSubType]) : null;
    $: posTypes = curSubType == 'Positions' ? Object.keys(graphsObj[curGraph][curSubType][curDubType]) : null;
    $: newGraph = posTypes ? graphsObj[curGraph][curSubType][curDubType][curPosType][Object.keys(graphsObj[curGraph][curSubType][curDubType][curPosType])[0]] : dubTypes ? graphsObj[curGraph][curSubType][curDubType][Object.keys(graphsObj[curGraph][curSubType][curDubType])[0]] : graphsObj[curGraph][curSubType][curDubType];
    $: yMin = newGraph.secondStats.length > 0 ? newGraph.yMin/2 : newGraph.yMin;
    $: yMax = newGraph.yMax;
    $: stats = newGraph.stats;
    $: secondStats = newGraph.secondStats;
    $: managers = newGraph.managers;
    $: recordManIDs = newGraph.recordManIDs;
    $: labels = newGraph.labels;
    $: header = newGraph.header;
    $: classes = newGraph.classes;

    const resortGraph = (newSort) => {
        if(curSort.sort) {
            const newGraph = posTypes ? graphsObj[curGraph][curSubType][curDubType][curPosType][newSort] : dubTypes ? graphsObj[curGraph][curSubType][curDubType][newSort] : graphsObj[curGraph][curSubType][newSort];
            yMin = newGraph.secondStats.length > 0 ? newGraph.yMin/2 : newGraph.yMin;
            yMax = newGraph.yMax;
            stats = newGraph.stats;
            secondStats = newGraph.secondStats;
            labels = newGraph.labels;
            header = newGraph.header; 
        }
    }
    $: resortGraph(curSort.sort);

    const refreshStats = (selection, displayYear) => {
        if((selection && selection != null) || (displayYear && displayYear != null)) {

            const processRefresh = (graph) => {
                let newStats = displayObject[selection][graph.statCat].stats;
                let newSecondStats; 
                if(graph.secondStatCat) {
                    newSecondStats = displayObject[selection][graph.secondStatCat].stats;
                }
                // if yearly stats, refresh the recordManIDs
                if(allTime == false) {
                    graph.recordManIDs = [];
                    graph.managers = [];
                    for(const recordManID in leagueManagers) {
                        if(leagueManagers[recordManID].yearsactive.includes(displayYear)) {
                            graph.recordManIDs.push(leagueManagers[recordManID].managerID);
                            graph.managers.push(allManagers[recordManID]);
                        }
                    }
                }
                for(let i = 0; i < graph.stats.length; i++) {
                    if(newStats.find(m => m.recordManID == graph.recordManIDs[i])) {
                        graph.stats[i] = Math.round(newStats.find(m => m.recordManID == graph.recordManIDs[i])[graph.field]);
                    } else {
                        graph.stats[i] = 0;
                    }
                }
                graph.yMin = min(graph.stats, 10);
                graph.yMax = max(graph.stats, 10);

                if(graph.secondStatCat) {
                    for(let i = 0; i < graph.secondStats.length; i++) {
                        if(newSecondStats.find(m => m.recordManID == graph.recordManIDs[i])) {
                            graph.secondStats[i] = Math.round(newSecondStats.find(m => m.recordManID == graph.recordManIDs[i])[graph.secondField]);
                        } else {
                            graph.secondStats[i] = 0;
                        }
                    }
                    graph.yMin = min(graph.secondStats, 10);
                }
                if(graph.yMinOverride) {
                    graph.yMin = graph.yMinOverride;
                }
            }

            for(const graphKey in graphsObj) {
                for(const subType in graphsObj[graphKey]) {
                    if(subType == 'Positions' || Object.keys(graphsObj[graphKey][subType]).includes('Best') || Object.keys(graphsObj[graphKey][subType]).includes('Weeks') || Object.keys(graphsObj[graphKey][subType]).includes('Bench')) {
                        for(const dubType in graphsObj[graphKey][subType]) {
                            for(const graphType in graphsObj[graphKey][subType][dubType]) {
                                if(subType == 'Positions') {
                                    for(const type in graphsObj[graphKey][subType][dubType][graphType]) {
                                        const graph = graphsObj[graphKey][subType][dubType][graphType][type];
                                        processRefresh(graph);
                                    }
                                } else {
                                    const graph = graphsObj[graphKey][subType][dubType][graphType];
                                    processRefresh(graph);
                                }
                            }
                        }
                    } else {
                        for(const graphType in graphsObj[graphKey][subType]) {
                            const graph = graphsObj[graphKey][subType][graphType];
                            processRefresh(graph);
                        }
                    }
                }
            }

            subTypes = Object.keys(graphsObj[curGraph]);
            dubTypes = Object.keys(graphsObj[curGraph][curSubType]).includes('Best') 
                    || Object.keys(graphsObj[curGraph][curSubType]).includes('Weeks') 
                    || Object.keys(graphsObj[curGraph][curSubType]).includes('Bench') 
                    || curSubType == 'Positions'
                    ? Object.keys(graphsObj[curGraph][curSubType]) : null;
            curSubType = 'Overall';
            curDubType = Object.keys(graphsObj[curGraph][curSubType])[0];
            posTypes = curSubType == 'Positions' ? Object.keys(graphsObj[curGraph][curSubType][curDubType]) : null;
            curPosType = posTypes ? posTypes[0] : null;

            stats = graphsObj[curGraph][curSubType][curDubType].stats;
            secondStats = graphsObj[curGraph][curSubType][curDubType].secondStats
            yMin = graphsObj[curGraph][curSubType][curDubType].secondStats.length > 0 ? graphsObj[curGraph][curSubType][curDubType].yMin/2 : graphsObj[curGraph][curSubType][curDubType].yMin;
            yMax = graphsObj[curGraph][curSubType][curDubType].yMax;
            recordManIDs = graphsObj[curGraph][curSubType][curDubType].recordManIDs;
            managers = graphsObj[curGraph][curSubType][curDubType].managers;
            classes = graphsObj[curGraph][curSubType][curDubType].classes;
            
        }
    }
    $: refreshStats(selection, displayYear);


    $: interval = (yMax - yMin) / 4;

    $: yScales = [
        yMin,
        yMin + interval,
        yMin + interval * 2,
        yMin + interval * 3,
        yMin + interval * 4,
    ];

	let el;

    let top = 0;
    let bottom = 0;
    let left = 0;
    let right = 0;

    let chartHeight = 0;
    let chartHeightInterval = 0;
    let chartWidth = 0;
    let chartWidthInterval = 0;

    let width = 0;

    // screen resize dimensions
    let xIFont = 1;
    let xIHeight = 160;
    let barLFont = 0.7;
    let lFont = 1;

    const resize = (w) => {
        width = maxWidth > 1000 ? 1000 : maxWidth;
        resizeInner();
        xIFont = xIntervalFont(maxWidth);
        xIHeight = xIntervalHeight(maxWidth);
        barLFont = barLabelFont(maxWidth);
        lFont = labelFont(maxWidth);
    }

    const resizeInner = () => {
        top = el?.getBoundingClientRect() ? el?.getBoundingClientRect().top  : 0;
        right = el?.getBoundingClientRect() ? el?.getBoundingClientRect().right  : 0;
        bottom = top + (width * 0.7 * 0.66);
        left = right - (width * 0.85);

        chartHeight = bottom - top;
        chartHeightInterval = chartHeight / 4;
        chartWidth = right - left;
        chartWidthInterval = chartWidth / (stats.length + 1);
    }

    $: resize(maxWidth);
    $: resize(innerWidth);


    let curClass = 0;
    let classStats, legendKeys;
    let oldGraph = curGraph;
    const changeClass = (newClass) => {

        if(classes && newClass != 0) {
            classStats = classes[newClass];
            legendKeys = classes[newClass].keys.slice().reverse();
            yMin = 0;
            yMax = classStats.yMax;
        } else {
            classStats = null;
            legendKeys = null;
            yMin = dubTypes || !curSort.sort ? graphsObj[curGraph][curSubType][curDubType].yMin : graphsObj[curGraph][curSubType][curSort.sort].yMin;
            yMax = dubTypes || !curSort.sort ? graphsObj[curGraph][curSubType][curDubType].yMax : graphsObj[curGraph][curSubType][curSort.sort].yMax;
        }
        
        curSubType = 'Overall';
        curDubType = dubTypes || !curSort.sort ? curDubType : curSort.sort;
        interval = (yMax - yMin) / 4;
        yScales = [
            yMin,
            yMin + interval,
            yMin + interval * 2,
            yMin + interval * 3,
            yMin + interval * 4,
        ];
    }
    $: changeClass(curClass);

    let theType, whatType;
    const changeType = (theType, whatType, curGraph) => {

        if(curGraph != oldGraph) {
            curSubType = 'Overall';
            curDubType = Object.keys(graphsObj[curGraph][curSubType])[0];
            curPosType = posTypes ? posTypes[0] : null;
            oldGraph = curGraph;
            return;
        }

        if(whatType == 'dub') {
            curDubType = theType;
        } else if(whatType == 'sub') {
            curSubType = theType;
        
            dubTypes = Object.keys(graphsObj[curGraph][curSubType]).includes('Best') 
                    || Object.keys(graphsObj[curGraph][curSubType]).includes('Weeks') 
                    || Object.keys(graphsObj[curGraph][curSubType]).includes('Bench') 
                    || curSubType == 'Positions'
                    ? Object.keys(graphsObj[curGraph][curSubType]) : null;
            curDubType = Object.keys(graphsObj[curGraph][curSubType])[0];
            posTypes = curSubType == 'Positions' ? Object.keys(graphsObj[curGraph][curSubType][curDubType]) : null;
            curPosType = posTypes ? posTypes[0] : null;
        }else if(whatType == 'pos') {
            curPosType = theType;
        }
   
        let newGraph;
        if(posTypes) {
            newGraph = graphsObj[curGraph][curSubType][curDubType][curPosType][Object.keys(graphsObj[curGraph][curSubType][curDubType][curPosType])[0]];
        } else if(dubTypes) {
            newGraph = graphsObj[curGraph][curSubType][curDubType][Object.keys(graphsObj[curGraph][curSubType][curDubType])[0]];
        } else {
            newGraph = graphsObj[curGraph][curSubType][curDubType];
        }

        yMin = newGraph.secondStats.length > 0 ? newGraph.yMin/2 : newGraph.yMin;
        yMax = newGraph.yMax;
        stats = newGraph.stats;
        secondStats = newGraph.secondStats;
        labels = newGraph.labels;
        header = newGraph.header;

        interval = (yMax - yMin) / 4;
        yScales = [
            yMin,
            yMin + interval,
            yMin + interval * 2,
            yMin + interval * 3,
            yMin + interval * 4,
        ];

    }
    $: changeType(theType, whatType, curGraph);
    
    let innerWidth;

</script>

<svelte:window bind:innerWidth={innerWidth} />

<style>
    :global(.opacity) {
        opacity: 0.3;
    }

    .chartWrapper {
		background-color: var(--fff);
        padding: 1em 0 0.5em;
        margin: 0 auto;
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
        overflow: hidden;
    }
    .barChart {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
    }

    .barChartInner {
        display: block;
        position: absolute;
        top: 0.1em;
        right: 0;
        border-bottom: 1px solid #ccc;
        border-left: 1px solid #ccc;
    }

    .barLabel {
        position: absolute;
        transform: translate(-50%, 0);
        line-height: 1.1em;
        left: 50%;
        color: var(--gcPlayRowText);
        bottom: 101%;
        text-align: center;
    }

    .yLabel {
        writing-mode: tb-rl;
        transform: rotate(-180deg);
        text-align: center;
    }

    .yIntervals {
        position: absolute;
        display: inline-block;
        top: 1em;
    }

    .yInterval {
        display: inline-block;
        position: absolute;
        width: 62px;
        text-align: right;
    }

    .xLabel {
        display: inline-block;
        right: 0;
        position: absolute;
        text-align: center;
        bottom: 5%;
    }

    .xIntervals {
        position: absolute;
        display: inline-block;
        right: 0;
    }

    .xInterval {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        position: absolute;
        writing-mode: tb-rl;
        transform: translate(-50%, 0) rotate(-160deg);
        word-break: break-word;
        text-align: center;
        line-height: 1em;
    }

    .bar {
        position: absolute;
        bottom: 0;
		transition: height 0.6s;
    }

    .legendColumn {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        width: 50%;
        font-size: 0.9em;
        font-weight: 420;
    }

    .legendRow {
        position: relative;
        display: inline-flex;
    }

    .legendBox {
        display: block;
        position: absolute;
        height: 18px;
        width: 18px;
        border: 0.25px solid var(--champShadow);
    }

    .legendHolder {
        display: inline-flex;
        flex-direction: column;
        position: absolute;
        bottom: 65px;
        left: 35px;
        width: 80px;
    }

    .classButton {
        position: absolute;
        text-align: center;
        bottom: -50px;
        left: -2px;
		transition: bottom 0.6s;
    }

    .subButton {
        position: absolute;
        text-align: center;
        bottom: -50px;
        right: -2px;
		transition: bottom 0.6s;
    }

    h6 {
        font-weight: 400;
        width: 100%;
        text-align: center;
        margin: 0 0 1em;
    }

    .buttonHolderG {
        text-align: center;
        margin: 1em 0 2em;
    }

    /* Start button resizing */

    @media (max-width: 525px) {
        :global(.buttonHolderG .selectionButtons) {
            font-size: 0.6em;
        }
    }

    @media (max-width: 405px) {
        :global(.buttonHolderG .selectionButtons) {
            font-size: 0.5em;
            padding: 0 6px;
        }
    }

    @media (max-width: 525px) {
        :global(.classButton .selectionButtons) {
            font-size: 0.6em;
        }
    }

    @media (max-width: 405px) {
        :global(.classButton .selectionButtons) {
            font-size: 0.5em;
            padding: 0 6px;
        }
    }

    /* End button resizing */
</style>
<!-- (stats[ix] - yMin) / (yMax - yMin == 0 ? 1 : (yMax - yMin)) * 100  -->
<h6>{header}</h6>
<div class="chartWrapper" style="width: {width}px; height: {width * .625}px">
    <div class="barChart" >
        <div class="barChartInner" style="width: {width * .85}px; height: {width * .7 * .66}px" bind:this={el}>
            <!-- x Axis label and intervals -->
            {#if classes && curClass != 0}
                {#each classStats.stats as subStats, ix}
                    {#each subStats as stat, iv}
                        <div class="bar" style="background-color: {classStats.colors[classStats.keys[iv]]}; width: {chartWidthInterval * 0.8}px; left: {chartWidthInterval * ix + (chartWidthInterval / 2)}px; height: {classStats.heights[ix][iv]}%; z-index: {classStats.heights[ix].length - iv};">
                            <span class="barLabel" style="font-size: {barLFont}em;">{stat}</span>
                        </div>
                    {/each}
                {/each}
            {:else}
                {#each stats as stat, ix}
                    <div class="bar{secondStats.length == 0  ? '' : curTableDesc == `${graphsObj[curGraph][curSubType][curDubType].statCat}.${graphsObj[curGraph][curSubType][curDubType].field}` ? '' : ' opacity'}" style="background-color: {colors[(recordManIDs[ix]-1) % 12]}; width: {chartWidthInterval * 0.8}px; left: {chartWidthInterval * ix + (chartWidthInterval / 2)}px; height: {(stat - yMin) / (yMax - yMin == 0 ? 1 : (yMax - yMin)) * 100}%;">
                        <span class="barLabel" style="font-size: {barLFont}em;">{stat}{labels.stat}</span>
                    </div>
                {/each}
                {#each secondStats as stat, ix}
                    <div class="bar{curTableDesc == `${graphsObj[curGraph][curSubType][curDubType].secondStatCat}.${graphsObj[curGraph][curSubType][curDubType].secondField}` ? '' : ' opacity'}" style="background-color: {colors[(recordManIDs[ix]-1) % 12]}; width: {chartWidthInterval * 0.8}px; left: {chartWidthInterval * ix + (chartWidthInterval / 2)}px; height: {(stat - yMin) / (yMax - yMin == 0 ? 1 : (yMax - yMin)) * 100}%;">
                        <span class="barLabel" style="font-size: {barLFont}em;">{stat}{labels.stat}</span>
                    </div>
                {/each}
            {/if}
        </div>

        <!-- y Axis label and intervals -->
        <div class="yAxis">
            <div class="label yLabel" style="height: {chartHeight}px; font-size: {lFont}em;">{labels.y}</div>
            <div class="yIntervals" style="right: {chartWidth + 65}px; height: {chartHeight}px;">
                {#each yScales as yScale, ix}
                    <div class="label yInterval" style="bottom: {chartHeightInterval * ix}px; font-size: {lFont}em;">{yScale}</div>
                {/each}
            </div>
        </div>

        <!-- x Axis label and intervals -->
        <div class="xAxis">
            <div class="label xLabel" style="width: {chartWidth}px; font-size: {lFont}em;">{labels.x}</div>
            <div class="classButton" style="{classes ? "bottom: -10px;" : null}">
                {#if classes}
                    {#if curClass != 0}
                        <div class="legendHolder">
                            {#each legendKeys as key}
                                <div class="legendRow">
                                    <div class="legendColumn">
                                        <div class="legendBox" style="background-color: {classStats.colors[key]}" />
                                    </div>
                                    <div class="legendColumn">
                                        {key}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                    <Group variant="outlined">
                        {#each classes as statClass, ix}
                            <Button class="selectionButtons" on:click={() => curClass = ix} variant="{curClass == ix ? "raised" : "outlined"}">
                                <Label>{statClass.short}</Label>
                            </Button>
                        {/each}
                    </Group>
                {/if}
            </div>
            <div class="subButton" style="{subTypes ? "bottom: -10px; z-index: 2;" : null}">
                {#if subTypes}
                    <Group variant="outlined">
                        {#each subTypes as subType}
                            <Button class="selectionButtons" on:click={() => changeType(subType, 'sub', curGraph)} variant="{curSubType == subType ? "raised" : "outlined"}">
                                <Label>{subType}</Label>
                            </Button>
                        {/each}
                    </Group>
                {/if}
            </div>
            <div class="subButton" style="{dubTypes ? "bottom: 27px; z-index: 1;" : "bottom: -10px; z-index: 1;"}">
                {#if dubTypes}
                    <Group variant="outlined">
                        {#each dubTypes as dubType}
                            <Button class="selectionButtons" on:click={() => changeType(dubType, 'dub', curGraph)} variant="{curDubType == dubType ? "raised" : "outlined"}">
                                <Label>{dubType}</Label>
                            </Button>
                        {/each}
                    </Group>
                {/if}
            </div>
            <div class="subButton" style="{posTypes ? "bottom: 64px; z-index: 1;" : "bottom: 27px; z-index: 1;"}">
                {#if curSubType == 'Positions' && posTypes}
                    <Group variant="outlined">
                        {#each posTypes as posType}
                            <Button class="selectionButtons" on:click={() => changeType(posType, 'pos', curGraph)} variant="{curPosType == posType ? "raised" : "outlined"}">
                                <Label>{posType}</Label>
                            </Button>
                        {/each}
                    </Group>
                {/if}
            </div>
            <div class="xIntervals" style="width: {chartWidth}px; top: {chartHeight + 6}px;">
                {#each managers as manager, ix}
                    <div class="xInterval" style="left: {chartWidthInterval * (ix + 0.5)}px; font-size: {xIFont}em; height: {xIHeight}px;">{manager.realname}</div>
                {/each}
            </div>
        </div>
    </div>
</div>

{#if graphKeys.length > 1}
    <div class="buttonHolderG">
        <Group variant="outlined">
            {#each graphKeys as graph}
                <Button class="selectionButtons" on:click={() => curGraph = graph} variant="{curGraph == graph ? "raised" : "outlined"}">
                    <Label>{graph}</Label>
                </Button>
            {/each}
        </Group>
    </div>
{/if}