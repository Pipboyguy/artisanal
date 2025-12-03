<svelte:head>
	<title>Artisanal</title>
</svelte:head>

<script lang="ts">
	import { Github } from 'lucide-svelte';

	type Repo = { repo: string; stars: number; last_active: string };
	type Key = keyof Repo;

	let { data } = $props();

	let key = $state<Key>('stars');
	let asc = $state(false);

	const sorted = $derived(
		[...data.repos].sort((a, b) => {
			const cmp = typeof a[key] === 'number' ? (a[key] as number) - (b[key] as number) : String(a[key]).localeCompare(String(b[key]));
			return asc ? cmp : -cmp;
		})
	);

	const sort = (k: Key) => { if (key === k) asc = !asc; else { key = k; asc = false; } };
</script>

<main class="max-w-4xl mx-auto p-8">
	<div class="flex items-center gap-3 mb-2">
		<h1 class="text-2xl font-bold">artisanal</h1>
		<a href="https://github.com/Pipboyguy/artisanal" target="_blank" class="text-zinc-400 hover:text-zinc-600">
			<Github size={18} />
		</a>
	</div>
	<p class="text-zinc-500 mb-6">Reject AI slop. Popular GitHub repos with no detected vibe coding activity.</p>

	<div class="border rounded-lg overflow-hidden">
		<table class="w-full text-sm table-fixed">
			<thead class="bg-zinc-50 border-b">
				<tr>
					<th class="p-3 text-left cursor-pointer hover:bg-zinc-100" onclick={() => sort('repo')}>Repo</th>
					<th class="p-3 text-right cursor-pointer hover:bg-zinc-100 w-24" onclick={() => sort('stars')}>Stars</th>
					<th class="p-3 text-right cursor-pointer hover:bg-zinc-100 w-32" onclick={() => sort('last_active')}>Last Active</th>
				</tr>
			</thead>
			<tbody>
				{#each sorted as r}
					<tr class="border-b last:border-b-0 hover:bg-zinc-50">
						<td class="p-3 text-left truncate"><a href="https://github.com/{r.repo}" target="_blank" class="text-blue-600 hover:underline">{r.repo}</a></td>
						<td class="p-3 text-right tabular-nums">{r.stars.toLocaleString()}</td>
						<td class="p-3 text-right tabular-nums">{r.last_active}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<p class="text-xs text-zinc-400 mt-4">Not yet detected: AGENTS.md, CLAUDE.md, .cursorrules, co-authored-by commit messages</p>
</main>
