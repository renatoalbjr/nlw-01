import knex from '../database/connection';
import { Request, Response } from 'express';

class PointsController {

    async index(req: Request, res: Response) {
        const {city, uf, items} = req.query;

        const query = knex('points').join('point_items', 'points.id', '=', 'point_items.point_id');

        if(items){
            const parsedItems = String(items)
            .split(',')
            .map(item => { return Number(item.trim()) });

            query.whereIn('item_id', parsedItems);
        }

        if(city) query.where('points.city', String(city));

        if(uf) query.where('points.uf', String(uf));

        query.select('points.*').distinct();

        const points = await query;

        let serializedPointsVar = [];

        for(let i = 0; i < points.length; i++){
            const point_id = points[i].id;
            const items = await knex('items')
            .join('point_items', 'items.id', '=' , 'point_items.item_id')
            .where('point_items.point_id', point_id)
            .select('items.*');
            serializedPointsVar.push({ point: {...points[i], image_url: `http://192.168.1.28:3333/uploads/${points[i].image}`}, items });
        }

        return res.json(serializedPointsVar);
    }

    async show(req: Request, res: Response) {
        const { id } = req.params;

        const point = await knex('points').where('id', id).first();

        if(!point){
            return res.status(404).json({ message: 'Point not found.' });
        }

        const items = await knex('items')
            .join('point_items', 'items.id', '=' , 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('items.*');

        return res.json({ point: {...point, image_url: `http://192.168.1.28:3333/uploads/${point.image}`}, items });
    }

    async create(req: Request, res: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = req.body;

        const point = {
            image: req.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };

        const trx = await knex.transaction();

        await trx('points').insert(point)
        .then(async (insertedIds) => {
            const point_id = insertedIds[0];
            const pointItems = items
                .split(',')
                .map((item: string) => Number(item.trim()))
                .map((item_id: number) => {
                    return {
                        item_id,
                        point_id
                    };
                });
            await trx('point_items').insert(pointItems);
            return point_id;
        })
        .then(async (point_id) => {
            await trx.commit();
            return res.status(201).json({ id: point_id, ...point, });
        })
        .catch(async () => {
            await trx.rollback();
            return res.status(400).json({ message: 'Falha na inserção na tabela point_items, verifique se os items informados são válidos' });
        });

    }
}

export default PointsController;
