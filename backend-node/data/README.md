# Data folder

Place the two source CSVs here before running the seed script:

- `matches.csv` — IPL match-level data
- `deliveries.csv` — ball-by-ball data

**Where to get them:** [IPL Complete Dataset on Kaggle](https://www.kaggle.com/datasets/patrickb1912/ipl-complete-dataset-20082020) 

Then from `backend-node/`:

```bash
npm run seed
```

These files are git-ignored because of their size (deliveries.csv is ~27 MB).
