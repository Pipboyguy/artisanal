<script lang="ts">
	import data from '../../static/data.json';

	type Repo = { repo: string; stars: number; commits: number; last_active: string };
	type Key = keyof Repo;

	let key = $state<Key>('stars');
	let asc = $state(false);

	const sorted = $derived(
		[...data as Repo[]].sort((a, b) => {
			const cmp = typeof a[key] === 'number' ? (a[key] as number) - (b[key] as number) : String(a[key]).localeCompare(String(b[key]));
			return asc ? cmp : -cmp;
		})
	);

	const sort = (k: Key) => { if (key === k) asc = !asc; else { key = k; asc = false; } };
</script>

<main class="max-w-4xl mx-auto p-8">
	<h1 class="text-2xl font-bold mb-2">artisanal</h1>
	<p class="text-zinc-500 mb-6">100+ star repos with zero AI involvement (last 12 months)</p>

	<div class="border rounded-lg overflow-hidden">
		<table class="w-full text-sm">
			<thead class="bg-zinc-50 border-b">
				<tr>
					<th class="p-3 text-left cursor-pointer hover:bg-zinc-100" onclick={() => sort('repo')}>Repo</th>
					<th class="p-3 text-right cursor-pointer hover:bg-zinc-100" onclick={() => sort('stars')}>Stars</th>
					<th class="p-3 text-right cursor-pointer hover:bg-zinc-100" onclick={() => sort('commits')}>Commits</th>
					<th class="p-3 text-right cursor-pointer hover:bg-zinc-100" onclick={() => sort('last_active')}>Last Active</th>
				</tr>
			</thead>
			<tbody>
				{#each sorted as r}
					<tr class="border-b hover:bg-zinc-50">
						<td class="p-3"><a href="https://github.com/{r.repo}" target="_blank" class="text-blue-600 hover:underline">{r.repo}</a></td>
						<td class="p-3 text-right">{r.stars.toLocaleString()}</td>
						<td class="p-3 text-right">{r.commits.toLocaleString()}</td>
						<td class="p-3 text-right">{r.last_active}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>
