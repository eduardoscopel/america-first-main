import { managers } from '$lib/utils/leagueInfo';
import { goto } from "$app/navigation";
import { stringDate } from './news';

export const cleanName = (name) => {
    return name.replace('Team ', '').toLowerCase().replace(/[ ’'!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~']/g, "");
}

export const round = (num) => {
    return (Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2);
}

export const min = (stats, roundOverride) => {
    const num = Math.min(...stats)
    return Math.floor(num / roundOverride) * roundOverride;
}

export const max = (stats, roundOverride) => {
    const num = Math.max(...stats)
    return Math.ceil(num / roundOverride) * roundOverride;
}

export const gotoManager = (recordManID) => {
    if(!managers.length) return;
    const managersIndex = managers.findIndex(m => m.managerID == recordManID);
    // if no manager exists for that roster, -1 will take you to the main managers page
    goto(`/managers?manager=${managersIndex}`);
}

export const getAuthor = (rosters, users, author) => {
    let user = null;
    for(const userKey of Object.keys(users)) {
        if(users[userKey].display_name.toLowerCase() == author.toLowerCase()) {
            user = users[userKey];
            break;
        }
    }
    if(!user) {
        return author;
    }
    const userID = user.user_id;
    const roster = rosters.find(r => r.owner_id == userID || (r.co_owners && r.co_owners.indexOf(userID) > -1));
    return `<a href="/managers?manager=${managers.findIndex(m => m.roster == roster.roster_id)}">${user.metadata.team_name ? user.metadata.team_name : user.display_name}</a>`;
}

export const getAvatar = (users, author) => {
    let user = null;
    let userAvatar;
    for(const userKey of Object.keys(users)) {
        if(users[userKey].display_name.toLowerCase() == author.toLowerCase()) {
            user = users[userKey];
            break;
        }
    }
    if(!user) {
        return 'managers/question.jpg';
    }

    if(user.avatar != null) {
        userAvatar = `https://sleepercdn.com/avatars/thumbs/${user.avatar}`;
    } else {
        userAvatar = `https://sleepercdn.com/images/v2/icons/player_default.webp`;
    }

    return userAvatar;
}

export const parseDate = (rawDate) => {
    const ts = Date.parse(rawDate);
    const d = new Date(ts);
    return stringDate(d);
}

export const generateGraph = ({stats, secondStats = null, x, y, stat, statCat, secondStatCat = null, header, field, short, secondField = null}, roundOverride = 10, yMinOverride = null) => {
    if(!stats) {
        return null;
    }
    const graph = {
        stats: [],
        secondStats: [],
        managers: [],
        recordManIDs: [],
        labels: {x, y, stat},
        statCat,
        secondStatCat,
        field,
        secondField,
        header,
        yMin: 0,
        yMax: 0,
        short
    }

    const sortedStats = [...stats].sort((a, b) => a.recordManID - b.recordManID);

    for(const indivStat of sortedStats) {
        graph.stats.push(Math.round(indivStat[field]));
        graph.managers.push(indivStat.manager);
        graph.recordManIDs.push(indivStat.recordManID)
    }

    if(secondField) {
        const sortedSecondStats = [...secondStats].sort((a, b) => a.recordManID - b.recordManID);

        for(const indivSecondStat of sortedSecondStats) {
            graph.secondStats.push(Math.round(indivSecondStat[secondField]));
        }
    }

    graph.yMax = max(graph.stats, roundOverride);
    graph.yMin = min(graph.stats, roundOverride);
    if(secondField) {
        graph.yMin = min(graph.secondStats, roundOverride);
    }
    if(yMinOverride) {
        graph.yMin = yMinOverride;
    }

    return graph;
}