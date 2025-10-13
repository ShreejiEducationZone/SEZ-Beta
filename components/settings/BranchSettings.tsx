import React, { useState, useEffect } from 'react';
import DeleteIcon from '../icons/DeleteIcon';

// FIX: Removed useData hook and changed component to accept props for consistency.
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
        } else {
            alert("Branch name must be unique and non-empty.");
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
        <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Manage Branches</h2>
            
            <div className="bg-card rounded-xl shadow-soft border border-border p-6 space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Current Branches</h3>
                    <div className="space-y-2">
                        {branches.map(branch => (
                            <div key={branch} className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                                <p className="font-semibold text-foreground">{branch}</p>
                                <button onClick={() => handleDelete(branch)} className="p-1 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-full">
                                    <DeleteIcon />
                                </button>
                            </div>
                        ))}
                         {branches.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">No branches added yet.</p>}
                    </div>
                </div>

                <form onSubmit={handleAdd} className="pt-4 border-t border-border space-y-2">
                    <label htmlFor="new-branch" className="text-sm font-semibold text-muted-foreground">Add New Branch</label>
                    <div className="flex gap-2">
                        <input
                            id="new-branch"
                            type="text"
                            value={newBranch}
                            onChange={(e) => setNewBranch(e.target.value)}
                            placeholder="New Branch Name"
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                        />
                        <button type="submit" className="h-10 px-4 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20">
                            Add
                        </button>
                    </div>
                </form>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
                    <button onClick={handleReset} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold" disabled={isSaving}>
                        Reset
                    </button>
                    <button onClick={handleSave} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold disabled:bg-muted" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BranchSettings;