import { db, auth } from './firebase';
import firebase from './firebase';
import { Project } from '../types';

const COLLECTION = 'projects';

export class ProjectService {
    /**
     * Listen for real-time updates to projects
     */
    static subscribeToProjects(callback: (projects: Project[]) => void, onError?: (error: any) => void): () => void {
        const user = auth.currentUser;
        if (!user) {
            if (onError) onError(new Error("User not authenticated"));
            return () => { };
        }

        const unsubscribe = db.collection(COLLECTION)
            .where('uid', '==', user.uid)
            // .orderBy('createdAt', 'desc') // Commented out to prevent "Missing Index" error for now
            .onSnapshot((snapshot) => {
                const projects = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Project[];
                callback(projects);
            }, (error) => {
                console.error("Error fetching projects:", error);
                if (onError) onError(error);
            });

        return unsubscribe;
    }

    /**
     * Add a new project
     */
    static async addProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<string> {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        try {
            const docRef = await db.collection(COLLECTION).add({
                ...project,
                uid: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding project:", error);
            throw error;
        }
    }

    /**
     * Update an existing project
     */
    static async updateProject(id: string, updates: Partial<Project>): Promise<void> {
        try {
            await db.collection(COLLECTION).doc(id).update(updates);
        } catch (error) {
            console.error("Error updating project:", error);
            throw error;
        }
    }

    /**
     * Delete a project
     */
    static async deleteProject(id: string): Promise<void> {
        try {
            await db.collection(COLLECTION).doc(id).delete();
        } catch (error) {
            console.error("Error deleting project:", error);
            throw error;
        }
    }

    /**
     * Update project status (Move card)
     */
    static async updateStatus(id: string, newStatus: Project['status']): Promise<void> {
        return this.updateProject(id, { status: newStatus });
    }
}
