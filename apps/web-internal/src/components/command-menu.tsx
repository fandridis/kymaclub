import * as React from "react";
import {
    Calendar,
    Search,
    Building2,
    Dumbbell,
    MapPin,
    Ticket,
    Users,
} from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
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

    console.log('results: ', results)

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
                className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-black/50 px-3 py-1.5 text-sm font-medium text-cyan-400/70 shadow-sm transition-colors hover:bg-cyan-950/30 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50"
            >
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="hidden sm:inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border border-cyan-500/20 bg-cyan-950/20 px-1.5 font-mono text-[10px] font-medium text-cyan-500 opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>
            <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
                <CommandInput
                    placeholder="Type a command or search..."
                    value={search}
                    onValueChange={setSearch}
                />
                <CommandList className="h-[30vh] max-h-[400px]">
                    {/* Static Suggestions */}
                    {search === "" && (
                        <CommandGroup heading="Suggestions">
                            <CommandItem value="dashboard" onSelect={() => runCommand(() => navigate({ to: "/dashboard" }))}>
                                <Calendar className="mr-2 h-5 w-5" />
                                <span>Dashboard</span>
                            </CommandItem>
                            <CommandItem value="businesses" onSelect={() => runCommand(() => navigate({ to: "/businesses" } as any))}>
                                <Building2 className="mr-2 h-5 w-5" />
                                <span>Businesses</span>
                            </CommandItem>
                            <CommandItem value="bookings" onSelect={() => runCommand(() => navigate({ to: "/bookings" }))}>
                                <Ticket className="mr-2 h-5 w-5" />
                                <span>Bookings</span>
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
                                            <Building2 className="mr-2 h-5 w-5" />
                                            <span>{business.name}</span>
                                            {business.matchType && (
                                                <span className="ml-auto text-sm text-cyan-500/50">
                                                    Matched by {business.matchType}
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
                                            <Users className="mr-2 h-5 w-5" />
                                            <span>{consumer.name || consumer.email}</span>
                                            {consumer.matchType && (
                                                <span className="ml-auto text-sm text-cyan-500/50">
                                                    Matched by {consumer.matchType}
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
