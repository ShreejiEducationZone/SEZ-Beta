import React, { useState, useEffect } from 'react';
import DeleteIcon from '../icons/DeleteIcon';

interface BranchSettingsProps {
    branches: string[];
    onSaveBranches: (branches: string[]) => Promise<void>;
}

const BranchSettings: React.FC<BranchSettingsProps> = ({ branches: initialBranches, onSaveBranches: handleSaveBranches }) => {
    const [branches, setBranches] = useState(initialBranches);
    const [newBranch, setNewBranch] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setBranches(initialBranches);
    }, [initialBranches]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedBranch = newBranch.trim();
        if (trimmedBranch && !branches.some(b => b.toLowerCase() === trimmedBranch.toLowerCase())) {
            setBranches([...branches, trimmedBranch].sort());
            setNewBranch('');
        } else if (trimmedBranch) {
            alert("Branch name must be unique.");
        }
    };

    const handleDelete = (branchToDelete: string) => {
        setBranches(branches.filter(b => b !== branchToDelete));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await handleSaveBranches(branches);
        } catch (error) {
            // Error toast is handled in context
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleReset = () => {
        setBranches(initialBranches);
    };

    return (
        <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Manage Branches</h2>
            
            <div className="bg-muted/50 rounded-xl border border-border p-6 space-y-6">
                <div>
                    <h3 className="text-base font-semibold text-foreground mb-2">Current Branches</h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto thin-scrollbar pr-2">
                        {branches.map(branch => (
                            <div key={branch} className="flex justify-between items-center bg-background p-3 rounded-md border border-border">
                                <p className="font-medium text-foreground">{branch}</p>
                                <button onClick={() => handleDelete(branch)} className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-full">
                                    <DeleteIcon />
                                </button>
                            </div>
                        ))}
                         {branches.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">No branches added yet.</p>}
                    </div>
                </div>

                <form onSubmit={handleAdd} className="pt-6 border-t border-border space-y-2">
                    <label htmlFor="new-branch" className="text-base font-semibold text-foreground">Add New Branch</label>
                    <div className="flex gap-2">
                        <input
                            id="new-branch"
                            type="text"
                            value={newBranch}
                            onChange={(e) => setNewBranch(e.target.value)}
                            placeholder="New Branch Name"
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                        />
                        <button type="submit" className="h-10 px-4 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 flex-shrink-0">
                            Add
                        </button>
                    </div>
                </form>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button onClick={handleReset} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold" disabled={isSaving}>
                    Reset
                </button>
                <button onClick={handleSave} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold disabled:bg-muted" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default BranchSettings;