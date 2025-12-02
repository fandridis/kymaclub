import * as React from "react";
import {
    Calendar,
    Search,
    Building2,
    Users,
    LayoutDashboard,
} from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@repo/api/convex/_generated/api";

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const debouncedSearch = useDebounce(search, 300);
    const navigate = useNavigate();

    const results = useQuery(api.internal.queries.search.searchGlobal, {
        query: debouncedSearch,
    });

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-400 shadow-sm transition-colors hover:bg-slate-700/50 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 backdrop-blur-sm"
            >
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline-flex">Search systems...</span>
                <span className="hidden sm:inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-slate-600 bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>
            <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
                <CommandInput
                    placeholder="Type a command or search..."
                    value={search}
                    onValueChange={setSearch}
                    className="border-slate-700"
                />
                <CommandList className="h-[30vh] max-h-[400px]">
                    {/* Static Suggestions */}
                    {search === "" && (
                        <CommandGroup heading="Quick Navigation">
                            <CommandItem value="dashboard" onSelect={() => runCommand(() => navigate({ to: "/dashboard" }))}>
                                <LayoutDashboard className="mr-2 h-4 w-4 text-cyan-400" />
                                <span>Dashboard</span>
                            </CommandItem>
                            <CommandItem value="bookings" onSelect={() => runCommand(() => navigate({ to: "/bookings" }))}>
                                <Calendar className="mr-2 h-4 w-4 text-blue-400" />
                                <span>Bookings</span>
                            </CommandItem>
                            <CommandItem value="classes" onSelect={() => runCommand(() => navigate({ to: "/classes" } as any))}>
                                <Calendar className="mr-2 h-4 w-4 text-purple-400" />
                                <span>Classes</span>
                            </CommandItem>
                        </CommandGroup>
                    )}

                    {/* Dynamic Results */}
                    {debouncedSearch && results && (
                        <>
                            {results.businesses.length > 0 && (
                                <CommandGroup heading="Businesses">
                                    {results.businesses.map((business: any) => (
                                        <CommandItem
                                            key={business._id}
                                            value={business._id}
                                            onSelect={() => runCommand(() => navigate({ to: `/businesses/${business._id}` } as any))}
                                        >
                                            <Building2 className="mr-2 h-4 w-4 text-cyan-400" />
                                            <span>{business.name}</span>
                                            {business.matchType && (
                                                <span className="ml-auto text-xs text-slate-500">
                                                    via {business.matchType}
                                                </span>
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {results.consumers.length > 0 && (
                                <CommandGroup heading="Consumers">
                                    {results.consumers.map((consumer: any) => (
                                        <CommandItem
                                            key={consumer._id}
                                            value={consumer._id}
                                            onSelect={() => runCommand(() => navigate({ to: `/consumers/${consumer._id}` } as any))}
                                        >
                                            <Users className="mr-2 h-4 w-4 text-green-400" />
                                            <span>{consumer.name || consumer.email}</span>
                                            {consumer.matchType && (
                                                <span className="ml-auto text-xs text-slate-500">
                                                    via {consumer.matchType}
                                                </span>
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {debouncedSearch && results.businesses.length === 0 && results.consumers.length === 0 && (
                                <CommandEmpty>No results found.</CommandEmpty>
                            )}
                        </>
                    )}

                    {debouncedSearch && !results && (
                        <CommandEmpty>Searching...</CommandEmpty>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
